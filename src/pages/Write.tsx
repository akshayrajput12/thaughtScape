
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, Send, PenTool } from "lucide-react";

const Write = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

    toast({
      title: "Success",
      description: "Thought shared successfully",
    });
    navigate('/');
  };

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
            <div className="space-y-2">
              <Textarea
                placeholder="Express your thoughts freely..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="min-h-[300px] text-base border-2 border-purple-100 focus:border-purple-300 focus:ring-purple-200 rounded-xl resize-none"
              />
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
