import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, Save, PenTool, Hash, AtSign } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Thought } from "@/types";

const EditThought = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalThought, setOriginalThought] = useState<Thought | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchThought = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('thoughts')
          .select(`
            *,
            author:profiles!thoughts_author_id_fkey (
              id,
              username,
              full_name,
              avatar_url,
              created_at,
              updated_at
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Check if the current user is the author or an admin
        if (data.author_id !== user?.id) {
          // Check if user is admin
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user?.id)
            .single();
            
          if (!profileData?.is_admin) {
            toast({
              title: "Unauthorized",
              description: "You don't have permission to edit this post",
              variant: "destructive",
            });
            navigate(`/thought/${id}`);
            return;
          }
        }
        
        setOriginalThought(data as Thought);
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        console.error("Error fetching thought:", error);
        toast({
          title: "Error",
          description: "Failed to load thought",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchThought();
  }, [id, user?.id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !id) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a post",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Extract hashtags from content
      const hashtagsRegex = /#([a-zA-Z0-9_]+)/g;
      const hashtags = content.match(hashtagsRegex)?.map(tag => tag.substring(1)) || [];

      // Extract mentions from content
      const mentionsRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = content.match(mentionsRegex)?.map(mention => mention.substring(1)) || [];

      const { error } = await supabase
        .from('thoughts')
        .update({
          title,
          content,
        })
        .eq('id', id);

      if (error) throw error;

      // Notify mentioned users if they're new mentions
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
            content: `You were mentioned in an updated post by ${user.email}`,
            related_user_id: user.id,
            related_thought_id: id
          }));
          
          await supabase.from('notifications').insert(notifications);
        }
      }

      toast({
        title: "Success",
        description: "Post updated successfully",
      });
      
      navigate(`/thought/${id}`);
    } catch (error) {
      console.error("Error updating thought:", error);
      toast({
        title: "Error",
        description: "Could not update post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
              Edit Your Post
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 max-w-xl mx-auto"
            >
              Update your content and share your revised perspective
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
                placeholder="Give your post a title..."
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
                className="min-h-[200px] resize-y border-2 border-purple-100 focus:border-purple-300 focus:ring-purple-200 rounded-xl"
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/thought/${id}`)}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Save Changes</span>
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditThought;
