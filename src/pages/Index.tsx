import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Hero } from "@/components/home/Hero";
import { FeaturedPoems } from "@/components/home/FeaturedPoems";
import type { Thought } from "@/types";

const THOUGHTS_PER_PAGE = 6;

const Index = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchThoughts = useCallback(async (pageNumber: number) => {
    try {
      console.log(`Fetching thoughts for page ${pageNumber}...`);
      setLoadingMore(true);

      const from = pageNumber * THOUGHTS_PER_PAGE;
      const to = from + THOUGHTS_PER_PAGE - 1;

      const { data: thoughtsData, error } = await supabase
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
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching thoughts:", error);
        toast({
          title: "Error",
          description: "Failed to load thoughts",
          variant: "destructive",
        });
        return;
      }

      console.log(`Fetched ${thoughtsData.length} thoughts`);
      
      if (thoughtsData.length < THOUGHTS_PER_PAGE) {
        setHasMore(false);
      }

      if (pageNumber === 0) {
        setThoughts(thoughtsData);
      } else {
        setThoughts(prev => [...prev, ...thoughtsData]);
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

      fetchThoughts(0);
    };

    initializeData();

    const thoughtsSubscription = supabase
      .channel('thoughts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thoughts'
        },
        () => {
          console.log("Thoughts updated, refreshing...");
          fetchThoughts(0);
        }
      )
      .subscribe();

    return () => {
      thoughtsSubscription.unsubscribe();
    };
  }, [fetchThoughts]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchThoughts(nextPage);
    }
  }, [fetchThoughts, loadingMore, hasMore, page]);

  const handleDeleteThought = async (thoughtId: string) => {
    try {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thought deleted successfully",
      });

      setThoughts(thoughts.filter(thought => thought.id !== thoughtId));
    } catch (error) {
      console.error("Error deleting thought:", error);
      toast({
        title: "Error",
        description: "Failed to delete thought",
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
        thoughts={thoughts} 
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onDeleteThought={handleDeleteThought}
        hasMore={hasMore}
        isLoading={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
};

export default Index;
