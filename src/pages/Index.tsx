import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@/types";

const Index = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin, is_profile_completed')
          .eq('id', currentSession.user.id)
          .single();
        
        setIsAdmin(profileData?.is_admin || false);
        setIsProfileCompleted(profileData?.is_profile_completed || false);
      }
    };

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
        .order('created_at', { ascending: false });

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

    fetchUserData();
    fetchPoems();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary/5 to-secondary/5">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container px-4 pt-24 pb-20 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl font-serif font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600"
        >
          Where Words Take Flight
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Join our community of poets and poetry enthusiasts. Share your verses, discover new voices, 
          and connect through the power of words.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Button
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={handleAction}
          >
            {!session ? "Join Now" : "Start Writing"}
          </Button>
        </motion.div>
      </motion.section>

      <section className="container px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-serif font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600"
        >
          Featured Poems
        </motion.h2>
        <div className="grid gap-8 max-w-4xl mx-auto">
          {poems.map((poem, index) => (
            <motion.div
              key={poem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <PoemCard
                poem={poem}
                currentUserId={session?.user?.id}
                isAdmin={isAdmin}
                onDelete={handleDeletePoem}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;