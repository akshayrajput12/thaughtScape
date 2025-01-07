import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Hero } from "@/components/home/Hero";
import { FeaturedPoems } from "@/components/home/FeaturedPoems";
import type { Poem } from "@/types";

const Index = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        console.log("Fetching poems...");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session?.user?.id);
        setCurrentUserId(session?.user?.id);

        const { data: poemsData, error } = await supabase
          .from('poems')
          .select(`
            *,
            author:profiles!poems_author_id_fkey (
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
          console.error("Error fetching poems:", error);
          toast({
            title: "Error",
            description: "Failed to load poems",
            variant: "destructive",
          });
          return;
        }

        console.log("Fetched poems:", poemsData);
        setPoems(poemsData);

        // Check if user is admin
        if (session?.user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .maybeSingle();
          setIsAdmin(profileData?.is_admin || false);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoems();

    // Set up realtime subscription for poems
    const poemsSubscription = supabase
      .channel('poems_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poems'
        },
        () => {
          console.log("Poems updated, refreshing...");
          fetchPoems();
        }
      )
      .subscribe();

    return () => {
      poemsSubscription.unsubscribe();
    };
  }, [toast]);

  const handleDeletePoem = async (poemId: string) => {
    try {
      const { error } = await supabase
        .from('poems')
        .delete()
        .eq('id', poemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poem deleted successfully",
      });

      setPoems(poems.filter(poem => poem.id !== poemId));
    } catch (error) {
      console.error("Error deleting poem:", error);
      toast({
        title: "Error",
        description: "Failed to delete poem",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/10">
      <Hero onActionClick={() => {}} isLoggedIn={!!currentUserId} />
      <FeaturedPoems 
        poems={poems} 
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onDeletePoem={handleDeletePoem}
      />
    </div>
  );
};

export default Index;