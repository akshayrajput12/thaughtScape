
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif font-bold mb-8 text-slate-800">Share a Thought</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              placeholder="Title your thought..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border-slate-200 focus:border-slate-400 focus:ring-slate-400"
            />
          </div>
          <div>
            <Textarea
              placeholder="Express your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[300px] border-slate-200 focus:border-slate-400 focus:ring-slate-400"
            />
          </div>
          <Button 
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-white"
          >
            Share
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Write;
