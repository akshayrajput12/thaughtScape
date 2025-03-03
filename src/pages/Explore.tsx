
import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PoemCard } from "@/components/PoemCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, Thought } from "@/types";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch thoughts with React Query
  const { data: thoughts = [], isLoading: thoughtsLoading } = useQuery({
    queryKey: ['thoughts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles!thoughts_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load thoughts",
          variant: "destructive",
        });
        throw error;
      }
      return data || [];
    }
  });

  // Fetch suggested users with React Query
  const { data: suggestedUsers = [], isLoading: suggestedUsersLoading } = useQuery({
    queryKey: ['suggestedUsers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .rpc('get_suggested_users', {
          user_id: user.id
        });

      if (error) {
        console.error('Error fetching suggested users:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (error) throw error;
      // Do something with the search results if needed
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleDelete = async (thoughtId: string) => {
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
    } catch (error) {
      console.error('Error deleting thought:', error);
      toast({
        title: "Error",
        description: "Failed to delete thought",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50 via-white to-purple-50/20">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-black-800 mb-4">
              Discover Amazing Thoughts
            </h1>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
              Explore a world of creativity and connect with inspiring minds
            </p>
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 blur-xl opacity-50 -z-10 rounded-full" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 h-14 bg-white/80 backdrop-blur-sm border-purple-100 focus:border-purple-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Thoughts */}
          <div className="lg:col-span-2 space-y-6">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-serif font-bold text-gray-800 mb-6 border-b border-purple-100 pb-4"
            >
              Latest Thoughts
            </motion.h2>
            {thoughtsLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center space-x-4 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6">
                {thoughts.map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <PoemCard
                      poem={thought}
                      currentUserId={user?.id || null}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Suggested Users */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100/50"
            >
              <h3 className="text-xl font-serif font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                Suggested Users
              </h3>
              {suggestedUsersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestedUsers.map((user: Profile, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group flex items-center justify-between gap-4 p-4 rounded-xl hover:bg-purple-50/80 transition-all duration-300 border border-transparent hover:border-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity" />
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.username}
                            className="relative w-12 h-12 rounded-full object-cover border-2 border-white"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.followers_count} followers
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {/* Add follow logic */}}
                        className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
                      >
                        Follow
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
