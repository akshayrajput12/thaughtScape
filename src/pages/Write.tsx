import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Write = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase
      .from('poems')
      .insert({
        title,
        content,
        author_id: session.user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Could not create poem",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Poem created successfully",
    });
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif font-bold mb-8">Write a Poem</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Write your poem..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[300px]"
            />
          </div>
          <Button type="submit">Publish</Button>
        </form>
      </div>
    </div>
  );
};

export default Write;