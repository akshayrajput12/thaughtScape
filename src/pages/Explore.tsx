import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PoemCard } from "@/components/PoemCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Profile, Thought } from "@/types";

const Explore = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id || null);

        // Fetch thoughts
        const { data: thoughtsData, error: thoughtsError } = await supabase
          .from('thoughts')
          .select(`
            *,
            author:profiles!thoughts_author_id_fkey(*)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (thoughtsError) throw thoughtsError;
        setThoughts(thoughtsData);

        // Fetch suggested users if logged in
        if (session?.user?.id) {
          const { data: suggestedData, error: suggestedError } = await supabase
            .rpc('get_suggested_users', {
              user_id: session.user.id
            });

          if (!suggestedError && suggestedData) {
            setSuggestedUsers(suggestedData);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load content",
          variant: "destructive",
        });
      }
    };

    fetchInitialData();
  }, []);

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
      setSuggestedUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleDelete = async (thoughtId: string) => {
    setThoughts(prev => prev.filter(t => t.id !== thoughtId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/20 pt-20">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 bg-white border-purple-100 focus:border-purple-200 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Thoughts */}
          <div className="lg:col-span-2 space-y-6">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-serif font-bold text-gray-800 mb-6"
            >
              Explore Thoughts
            </motion.h2>
            {thoughts.map((thought, index) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PoemCard
                  poem={thought}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>

          {/* Sidebar - Suggested Users */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-purple-100/50"
            >
              <h3 className="text-lg font-serif font-semibold text-gray-800 mb-4">
                Suggested Users
              </h3>
              <div className="space-y-4">
                {suggestedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.followers_count} followers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {/* Add follow logic */}}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      Follow
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
