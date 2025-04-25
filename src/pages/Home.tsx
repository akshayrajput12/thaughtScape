
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Thought } from "@/types";
import { Loader2 } from "lucide-react";
import { ThoughtCard } from "@/components/thoughts/ThoughtCard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Home = () => {
  const { data: thoughts, isLoading } = useQuery({
    queryKey: ['thoughts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url),
          _count(
            likes(count),
            bookmarks(count),
            comments(count)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Thought[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Feed</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {thoughts?.map((thought) => (
            <ThoughtCard key={thought.id} thought={thought} />
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Home;
