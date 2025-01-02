import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Poem } from "@/types";

export const PoemsList = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPoems = async () => {
      const { data: poemsData, error } = await supabase
        .from('poems')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch poems",
          variant: "destructive",
        });
        return;
      }

      setPoems(poemsData || []);
    };

    fetchPoems();
  }, [toast]);

  const handleDeletePoem = async (poemId: string) => {
    const { error } = await supabase
      .from('poems')
      .delete()
      .eq('id', poemId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete poem",
        variant: "destructive",
      });
      return;
    }

    setPoems(poems.filter(poem => poem.id !== poemId));
    toast({
      title: "Success",
      description: "Poem deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      {poems.map((poem) => (
        <div key={poem.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-serif font-semibold">{poem.title}</h3>
              <p className="text-sm text-gray-500">
                by {poem.author.full_name} (@{poem.author.username})
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeletePoem(poem.id)}
            >
              Delete
            </Button>
          </div>
          <p className="text-gray-700 whitespace-pre-line">{poem.content}</p>
          <div className="mt-4 text-sm text-gray-500">
            {new Date(poem.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};