
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, Send, PenTool, Hash, AtSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/types";

const Write = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [textareaSelectionStart, setTextareaSelectionStart] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Common hashtags that might be suggested
  const commonHashtags = [
    "poetry", "thoughts", "inspiration", "love", "life", 
    "motivation", "wisdom", "creativity", "philosophy", "mindfulness"
  ];

  // Fetch followers for user mentions
  const { data: followers = [] } = useQuery({
    queryKey: ['followers-for-mentions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', session.user.id);

      if (error) throw error;
      return data.map(d => d.following as Profile).filter(Boolean);
    },
    enabled: isProfileCompleted
  });

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_profile_completed')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_profile_completed) {
        navigate(`/profile/${session.user.id}`);
        return;
      }

      setIsProfileCompleted(true);
    };

    checkProfile();
  }, [navigate]);

  useEffect(() => {
    // Monitor textarea for @ and # characters
    const handleContentChange = () => {
      if (!textareaRef.current) return;
      
      const cursorPosition = textareaRef.current.selectionStart;
      setTextareaSelectionStart(cursorPosition);
      
      // Find the word being typed
      const textBeforeCursor = content.substring(0, cursorPosition);
      const words = textBeforeCursor.split(/\s/);
      const currentWord = words[words.length - 1];
      
      if (currentWord.startsWith('#')) {
        setShowHashtagSuggestions(true);
        setShowUserSuggestions(false);
        setSearchQuery(currentWord.substring(1)); // Remove the # character
      } else if (currentWord.startsWith('@')) {
        setShowUserSuggestions(true);
        setShowHashtagSuggestions(false);
        setSearchQuery(currentWord.substring(1)); // Remove the @ character
      } else {
        setShowHashtagSuggestions(false);
        setShowUserSuggestions(false);
      }
    };
    
    handleContentChange();
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isProfileCompleted) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before sharing thoughts.",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    // Extract hashtags from content
    const hashtagsRegex = /#([a-zA-Z0-9_]+)/g;
    const hashtags = content.match(hashtagsRegex)?.map(tag => tag.substring(1)) || [];

    // Extract mentions from content
    const mentionsRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = content.match(mentionsRegex)?.map(mention => mention.substring(1)) || [];

    const { error } = await supabase
      .from('thoughts')
      .insert({
        title,
        content,
        author_id: session.user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Could not create thought",
        variant: "destructive",
      });
      return;
    }

    // Notify mentioned users
    if (mentions.length > 0) {
      // Get profile data for mentioned users
      const { data: mentionedProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', mentions);
      
      if (mentionedProfiles && mentionedProfiles.length > 0) {
        const notifications = mentionedProfiles.map(profile => ({
          type: 'mention',
          user_id: profile.id,
          content: `You were mentioned in a thought by ${session.user.email}`,
          related_user_id: session.user.id
        }));
        
        await supabase.from('notifications').insert(notifications);
      }
    }

    toast({
      title: "Success",
      description: "Thought shared successfully",
    });
    navigate('/');
  };

  const insertTextAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaSelectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // Find the last word before cursor to replace
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];
    
    // Replace the current word (starting with # or @) with the suggestion
    const newTextBeforeCursor = textBeforeCursor.substring(0, cursorPosition - lastWord.length) + textToInsert;
    setContent(newTextBeforeCursor + " " + textAfterCursor);
    
    // Hide suggestions
    setShowHashtagSuggestions(false);
    setShowUserSuggestions(false);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPosition = newTextBeforeCursor.length + 1;
        textareaRef.current.selectionStart = newCursorPosition;
        textareaRef.current.selectionEnd = newCursorPosition;
      }
    }, 0);
  };

  const filteredHashtags = commonHashtags
    .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);
    
  const filteredUsers = followers
    .filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, 5);

  if (!isProfileCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <PenTool className="h-12 w-12 text-purple-500 mb-4" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"
            >
              Share Your Thought
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 max-w-xl mx-auto"
            >
              Express yourself freely and connect with others through your unique perspective
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mt-4"
            >
              <div className="flex items-center text-sm text-gray-500">
                <Hash className="w-4 h-4 mr-1 text-blue-500" />
                <span>Use # for hashtags</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <AtSign className="w-4 h-4 mr-1 text-purple-500" />
                <span>Use @ to mention users</span>
              </div>
            </motion.div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-purple-100"
          >
            <div className="space-y-2">
              <Input
                placeholder="Give your thought a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-lg font-medium border-2 border-purple-100 focus:border-purple-300 focus:ring-purple-200 rounded-xl"
              />
            </div>
            <div className="space-y-2 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Express your thoughts freely... Use #hashtags and @mention users"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="min-h-[300px] text-base border-2 border-purple-100 focus:border-purple-300 focus:ring-purple-200 rounded-xl resize-none"
              />
              
              {/* Hashtag suggestions */}
              {showHashtagSuggestions && filteredHashtags.length > 0 && (
                <div className="absolute z-10 w-64 mt-1 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-48">
                  <div className="py-1">
                    {filteredHashtags.map((tag, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                        onClick={() => insertTextAtCursor(`#${tag}`)}
                      >
                        <Hash className="w-4 h-4 mr-2 text-blue-500" />
                        <span>{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* User suggestions */}
              {showUserSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-64 mt-1 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-48">
                  <div className="py-1">
                    {filteredUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                        onClick={() => insertTextAtCursor(`@${user.username}`)}
                      >
                        <AtSign className="w-4 h-4 mr-2 text-purple-500" />
                        <div>
                          <div className="font-medium">{user.username}</div>
                          {user.full_name && (
                            <div className="text-xs text-gray-500">{user.full_name}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
              >
                <span>Share Thought</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-sm text-gray-500"
          >
            <p className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Your thoughts matter. Share them with the world.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Write;
