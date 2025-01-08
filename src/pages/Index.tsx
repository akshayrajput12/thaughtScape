import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Hero } from "@/components/home/Hero";
import { FeaturedPoems } from "@/components/home/FeaturedPoems";
import type { Poem } from "@/types";

const POEMS_PER_PAGE = 6;

const Index = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPoems = useCallback(async (pageNumber: number) => {
    try {
      console.log(`Fetching poems for page ${pageNumber}...`);
      setLoadingMore(true);

      const from = pageNumber * POEMS_PER_PAGE;
      const to = from + POEMS_PER_PAGE - 1;

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
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching poems:", error);
        toast({
          title: "Error",
          description: "Failed to load poems",
          variant: "destructive",
        });
        return;
      }

      console.log(`Fetched ${poemsData.length} poems`);
      
      if (poemsData.length < POEMS_PER_PAGE) {
        setHasMore(false);
      }

      if (pageNumber === 0) {
        setPoems(poemsData);
      } else {
        setPoems(prev => [...prev, ...poemsData]);
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
      setLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session?.user?.id);
      setCurrentUserId(session?.user?.id);

      if (session?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        setIsAdmin(profileData?.is_admin || false);
      }

      fetchPoems(0);
    };

    initializeData();

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
          fetchPoems(0);
        }
      )
      .subscribe();

    return () => {
      poemsSubscription.unsubscribe();
    };
  }, [fetchPoems]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPoems(nextPage);
    }
  }, [fetchPoems, loadingMore, hasMore, page]);

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
        hasMore={hasMore}
        isLoading={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
};

export default Index;