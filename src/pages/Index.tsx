import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Hero } from "@/components/home/Hero";
import { FeaturedPoems } from "@/components/home/FeaturedPoems";
import type { Poem } from "@/types";

const Index = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log("Current session:", currentSession?.user?.id);
      setSession(currentSession);

      if (currentSession?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin, is_profile_completed')
          .eq('id', currentSession.user.id)
          .maybeSingle();
        
        setIsAdmin(profileData?.is_admin || false);
        setIsProfileCompleted(profileData?.is_profile_completed || false);
      }
      setLoading(false);
    };

    const fetchPoems = async () => {
      console.log("Fetching poems...");
      try {
        const { data, error } = await supabase
          .from('poems')
          .select(`
            *,
            author:profiles!poems_author_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching poems:', error);
          toast({
            title: "Error",
            description: "Could not load poems",
            variant: "destructive",
          });
          return;
        }

        console.log("Fetched poems:", data);
        setPoems(data as Poem[]);
      } catch (error) {
        console.error('Error in fetchPoems:', error);
        toast({
          title: "Error",
          description: "Failed to load poems",
          variant: "destructive",
        });
      }
    };

    fetchUserData();
    fetchPoems();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed in Index:", _event, session?.user?.id);
      setSession(session);
      if (session) {
        fetchUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleAction = () => {
    if (!session) {
      navigate('/auth');
      return;
    }

    if (!isProfileCompleted) {
      navigate(`/profile/${session.user.id}`);
      return;
    }

    navigate('/write');
  };

  const handleDeletePoem = (poemId: string) => {
    setPoems(poems.filter(poem => poem.id !== poemId));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary/5 to-secondary/5">
      <Hero 
        onActionClick={handleAction}
        isLoggedIn={!!session}
      />
      <FeaturedPoems
        poems={poems}
        currentUserId={session?.user?.id}
        isAdmin={isAdmin}
        onDeletePoem={handleDeletePoem}
      />
    </div>
  );
};

export default Index;