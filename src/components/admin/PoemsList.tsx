
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Thought } from "@/types";

export const PoemsList = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchThoughts = async () => {
      const { data: thoughtsData, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles(
            id,
            username,
            full_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching thoughts:', error);
        toast({
          title: "Error",
          description: "Could not fetch thoughts",
          variant: "destructive",
        });
        return;
      }

      setThoughts(thoughtsData as Thought[]);
    };

    fetchThoughts();
  }, [toast]);

  const handleDeleteThought = async (thoughtId: string) => {
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', thoughtId);

    if (error) {
      console.error('Error deleting thought:', error);
      toast({
        title: "Error",
        description: "Could not delete thought",
        variant: "destructive",
      });
      return;
    }

    setThoughts(thoughts.filter(thought => thought.id !== thoughtId));
    toast({
      title: "Success",
      description: "Thought deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      {thoughts.map((thought) => (
        <div key={thought.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-serif font-semibold">{thought.title}</h3>
              <p className="text-sm text-gray-500">
                by {thought.author.full_name || thought.author.username}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteThought(thought.id)}
            >
              Delete
            </Button>
          </div>
          <p className="text-gray-700 whitespace-pre-line">{thought.content}</p>
          <div className="mt-4 text-sm text-gray-500">
            {new Date(thought.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};
