import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, Send, PenTool, Hash, AtSign, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useThoughtLimits } from "@/hooks/use-thought-limits";
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
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Use the thought limits hook
  const { canCreate, dailyRemaining, monthlyRemaining, reason, isLoading: isLoadingLimits } = useThoughtLimits(currentUserId);

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

      setCurrentUserId(session.user.id);

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

    if (!canCreate) {
      const limitMessage = reason === 'daily_limit_reached'
        ? "You've reached your daily limit of 1 thought. Please try again tomorrow."
        : "You've reached your monthly limit of 15 thoughts. Please try again next month.";
      
      toast({
        title: "Limit Reached",
        description: limitMessage,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Posting limits banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Alert className={!canCreate ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800" : "bg-indigo-50 dark:bg-indigo-900/20"}>
              <AlertCircle className={!canCreate ? "h-4 w-4 text-red-500 dark:text-red-400" : "h-4 w-4 text-indigo-500 dark:text-indigo-400"} />
              <AlertTitle className="font-medium">
                {!canCreate 
                  ? "Posting limit reached" 
                  : "Posting limits"
                }
              </AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  {!canCreate 
                    ? (reason === 'daily_limit_reached' 
                      ? "You've reached your daily limit of 1 thought. Please try again tomorrow." 
                      : "You've reached your monthly limit of 15 thoughts. Please try again next month.")
                    : `You can post ${dailyRemaining} more thought today and ${monthlyRemaining} more thoughts this month.`
                  }
                </p>
              </AlertDescription>
            </Alert>
          </motion.div>
          
          {/* Keep the rest of the UI unchanged */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 10
              }}
              className="inline-block bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-5 rounded-full shadow-md"
            >
              <PenTool className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mt-6 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
            >
              Share Your Thought
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto"
            >
              Express yourself freely and connect with others through your unique perspective
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4 mt-6"
            >
              <div className="flex items-center text-sm px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                <Hash className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                <span>Use # for hashtags</span>
              </div>
              <div className="flex items-center text-sm px-3 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                <AtSign className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                <span>Use @ to mention users</span>
              </div>
            </motion.div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-700 backdrop-blur-sm"
          >
            <div className="space-y-2">
              <Input
                placeholder="Give your thought a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-lg font-medium border-2 border-blue-100 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-700 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                disabled={!canCreate}
              />
            </div>
            <div className="space-y-2 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Express your thoughts freely... Use #hashtags and @mention users"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="min-h-[300px] text-base border-2 border-blue-100 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-700 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl resize-none bg-white dark:bg-gray-800 dark:text-white"
                disabled={!canCreate}
              />

              {/* Hashtag suggestions */}
              {showHashtagSuggestions && filteredHashtags.length > 0 && (
                <div className="absolute z-10 w-64 mt-1 overflow-auto bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-lg shadow-lg max-h-48">
                  <div className="py-1">
                    {filteredHashtags.map((tag, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center"
                        onClick={() => insertTextAtCursor(`#${tag}`)}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-2">
                          <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="dark:text-white">{tag}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* User suggestions */}
              {showUserSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-72 mt-1 overflow-auto bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-lg shadow-lg max-h-48">
                  <div className="py-1">
                    {filteredUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center"
                        onClick={() => insertTextAtCursor(`@${user.username}`)}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-3">
                          <AtSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <div className="font-medium dark:text-white">{user.username}</div>
                          {user.full_name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.full_name}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <motion.div
                whileHover={{ scale: !canCreate ? 1 : 1.03 }}
                whileTap={{ scale: !canCreate ? 1 : 0.97 }}
              >
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-white px-8 py-6 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
                  disabled={!canCreate || isLoadingLimits}
                >
                  <span>{isLoadingLimits ? "Checking limits..." : "Share Thought"}</span>
                  <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/10 dark:to-indigo-900/10 backdrop-blur-sm border border-blue-100/50 dark:border-blue-800/30">
              <p className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                Your thoughts matter. Share them with the world.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Write;
