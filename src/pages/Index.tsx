import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Hero } from "@/components/home/Hero";
import { FeaturedPoems } from "@/components/home/FeaturedPoems";
import { Footer } from "@/components/home/Footer";
import { NotificationPopup } from "@/components/notifications/NotificationPopup";
import type { Thought } from "@/types";
import { useNavigate } from "react-router-dom";
import { safeLog, safeErrorLog, maskId } from "@/utils/sanitizeData";

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
  const navigate = useNavigate();

  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unviewedApplications, setUnviewedApplications] = useState(0);
  const [newProjects, setNewProjects] = useState(0);

  const fetchThoughts = useCallback(async (pageNumber: number) => {
    try {
      safeLog(`Fetching thoughts for page ${pageNumber}...`);
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
        safeErrorLog("Error fetching thoughts", error);
        toast({
          title: "Error",
          description: "Failed to load thoughts",
          variant: "destructive",
        });
        return;
      }

      safeLog(`Fetched ${thoughtsData.length} thoughts`);

      if (thoughtsData.length < THOUGHTS_PER_PAGE) {
        setHasMore(false);
      }

      if (pageNumber === 0) {
        setThoughts(thoughtsData);
      } else {
        setThoughts(prev => [...prev, ...thoughtsData]);
      }
    } catch (error) {
      safeErrorLog("Unexpected error", error);
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
      safeLog("Current session", session?.user ? { userId: maskId(session.user.id) } : { userId: null });
      setCurrentUserId(session?.user?.id);

      if (session?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        setIsAdmin(profileData?.is_admin || false);

        // Fetch notification data
        const fetchNotificationData = async () => {
          try {
            // Set default values instead of querying messages table
            setUnreadMessages(0);

            // Fetch projects by user to get applications
            const { data: userProjects } = await supabase
              .from("projects")
              .select("id")
              .eq("author_id", session.user.id);

            if (userProjects && userProjects.length > 0) {
              const projectIds = userProjects.map(p => p.id);

              // Fetch unviewed applications
              const { count: applicationsCount } = await supabase
                .from("project_applications")
                .select("id", { count: 'exact', head: true })
                .is("viewed_at", null)
                .in("project_id", projectIds);

              setUnviewedApplications(applicationsCount || 0);
            }

            // Fetch new projects
            const { count: projectsCount } = await supabase
              .from("projects")
              .select("id", { count: 'exact', head: true })
              .eq("status", "open")
              .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            setNewProjects(projectsCount || 0);

            // Show notification if there are any unread items
            if ((unviewedApplications || 0) + (projectsCount || 0) > 0) {
              // Delay showing notification to allow page to load first
              setTimeout(() => setShowNotification(true), 1500);
            }
          } catch (error) {
            safeErrorLog("Error fetching notification data", error);
          }
        };

        fetchNotificationData();
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
          safeLog("Thoughts updated, refreshing...");
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
      // First delete any likes associated with this thought
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('thought_id', thoughtId);

      if (likesError) {
        safeErrorLog("Error deleting likes", likesError);
        toast({
          title: "Error",
          description: "Failed to delete associated likes",
          variant: "destructive",
        });
        return;
      }

      // Then delete any comments associated with this thought
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('thought_id', thoughtId);

      if (commentsError) {
        safeErrorLog("Error deleting comments", commentsError);
        toast({
          title: "Error",
          description: "Failed to delete associated comments",
          variant: "destructive",
        });
        return;
      }

      // Then delete any bookmarks associated with this thought
      const { error: bookmarksError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('thought_id', thoughtId);

      if (bookmarksError) {
        safeErrorLog("Error deleting bookmarks", bookmarksError);
        toast({
          title: "Error",
          description: "Failed to delete associated bookmarks",
          variant: "destructive",
        });
        return;
      }

      // Finally delete the thought itself
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
      safeErrorLog("Error deleting thought", error);
      toast({
        title: "Error",
        description: "Failed to delete thought",
        variant: "destructive",
      });
    }
  };

  const handleHeroAction = () => {
    if (currentUserId) {
      navigate("/write");
    } else {
      navigate("/auth");
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
      <Hero onActionClick={handleHeroAction} isLoggedIn={!!currentUserId} />
      <FeaturedPoems
        thoughts={thoughts}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onDeleteThought={handleDeleteThought}
        hasMore={hasMore}
        isLoading={loadingMore}
        onLoadMore={handleLoadMore}
      />
      <Footer />

      {currentUserId && (
        <NotificationPopup
          unreadMessages={unreadMessages}
          projectApplications={unviewedApplications}
          newProjects={newProjects}
          isVisible={showNotification}
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
};

export default Index;
