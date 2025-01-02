import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@/types";

const Index = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const fetchPoems = async () => {
      const { data, error } = await supabase
        .from('poems')
        .select(`
          *,
          author:profiles!poems_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          likes (count),
          bookmarks (count)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching poems:', error);
        return;
      }

      const formattedPoems = data.map(poem => ({
        ...poem,
        _count: {
          likes: poem.likes[0]?.count || 0,
          bookmarks: poem.bookmarks[0]?.count || 0
        }
      }));

      setPoems(formattedPoems);
    };

    fetchPoems();
  }, []);

  const handleDeletePoem = async (poemId: string) => {
    const { error } = await supabase
      .from('poems')
      .delete()
      .eq('id', poemId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete the poem",
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
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/10">
      <section className="container px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-serif font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
          Where Words Take Flight
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join our community of poets and poetry enthusiasts. Share your verses, discover new voices, and connect through the power of words.
        </p>
        {!session ? (
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-lg"
            onClick={() => navigate('/auth')}
          >
            Join Now
          </Button>
        ) : (
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-lg"
            onClick={() => navigate('/write')}
          >
            Start Writing
          </Button>
        )}
      </section>

      <section className="container px-4 py-16">
        <h2 className="text-3xl font-serif font-bold mb-8 text-center">Featured Poems</h2>
        <div className="grid gap-8 max-w-4xl mx-auto">
          {poems.map((poem) => (
            <PoemCard
              key={poem.id}
              poem={poem}
              currentUserId={session?.user?.id}
              onDelete={handleDeletePoem}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;