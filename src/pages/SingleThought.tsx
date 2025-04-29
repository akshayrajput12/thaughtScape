import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PoemCard } from "@/components/PoemCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, Edit2 } from "lucide-react";
import type { Thought } from "@/types";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const SingleThought = () => {
  const { id } = useParams<{ id: string }>();
  const [thought, setThought] = useState<Thought | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThought = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
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
          .eq('id', id)
          .single();

        if (error) throw error;
        setThought(data as Thought);

        // Check if user is admin
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          setIsAdmin(!!profileData?.is_admin);
        }
      } catch (error) {
        console.error("Error fetching thought:", error);
        toast({
          title: "Error",
          description: "Failed to load thought",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThought();
  }, [id, user?.id, toast]);

  const handleAuthPrompt = () => {
    navigate('/auth', { state: { from: `/thought/${id}` } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!thought) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Thought not found</h1>
        <p className="text-gray-600 mb-8">The thought you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add SEO component for better link sharing */}
      {thought && (
        <SEO
          title={thought.title || "Thought"}
          description={thought.content.substring(0, 150) + (thought.content.length > 150 ? '...' : '')}
          companyName={thought.author?.full_name || thought.author?.username || "User"}
          ogType="article"
          ogUrl={window.location.href}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {!isAuthenticated && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6 text-center">
            <p className="text-purple-800 mb-2">Sign in to like, comment, or share this thought</p>
            <Button onClick={handleAuthPrompt} variant="outline" className="bg-white">
              Sign In / Sign Up
            </Button>
          </div>
        )}

        {isAuthenticated && user?.id === thought?.author.id && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => navigate(`/thought/${id}/edit`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Post
            </Button>
          </div>
        )}

        <PoemCard
          poem={thought}
          currentUserId={user?.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default SingleThought;
