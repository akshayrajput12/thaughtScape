
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Thought } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PoemsList = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchThoughts = async () => {
      const { data: thoughtsData, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles!thoughts_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            created_at,
            updated_at
          ),
          likes:likes(count),
          bookmarks:bookmarks(count),
          comments:comments(count)
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

      // Map the response data to the Thought type
      const mappedThoughts = thoughtsData.map((thought) => ({
        ...thought,
        likes_count: thought.likes?.[0]?.count || 0,
        comments_count: thought.comments?.[0]?.count || 0,
        _count: {
          likes: thought.likes?.[0]?.count || 0,
          bookmarks: thought.bookmarks?.[0]?.count || 0,
          comments: thought.comments?.[0]?.count || 0
        }
      })) as Thought[];

      setThoughts(mappedThoughts);
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
      <Button 
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Refresh Thoughts List
      </Button>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {thoughts.map((thought) => (
          <div
            key={thought.id}
            className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {thought.author.avatar_url && (
                      <img
                        src={thought.author.avatar_url}
                        alt={thought.author.username}
                        className="w-10 h-10 rounded-full border-2 border-gray-100"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {thought.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {thought.author.full_name || thought.author.username}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 line-clamp-3">{thought.content}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                  {thought.likes?.[0]?.count || 0} Likes
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                  {thought.bookmarks?.[0]?.count || 0} Bookmarks
                </Badge>
                <Badge variant="secondary" className="bg-pink-50 text-pink-700">
                  {thought.comments?.[0]?.count || 0} Comments
                </Badge>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {new Date(thought.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteThought(thought.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
