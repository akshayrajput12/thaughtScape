
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PoemCard } from "@/components/PoemCard";
import type { Thought, Profile } from "@/types";

interface SuggestedUser extends Profile {
  is_following: boolean;
}

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/auth");
          return;
        }
        setCurrentUserId(session.user.id);
        
        // Fetch thoughts
        const { data: thoughtsData, error: thoughtsError } = await supabase
          .from('thoughts')
          .select(`
            *,
            author:profiles!thoughts_author_id_fkey(*)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (thoughtsError) throw thoughtsError;
        setThoughts(thoughtsData || []);

        // Fetch suggested users with custom function
        const { data: suggestedData, error: suggestedError } = await supabase
          .from('profiles')
          .select('*, followers_count, following_count, posts_count')
          .neq('id', session.user.id)
          .limit(5);

        if (suggestedError) throw suggestedError;
        
        // Add is_following property
        const suggestedWithFollowing = await Promise.all(
          (suggestedData || []).map(async (user) => {
            const { data: isFollowing } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', session.user.id)
              .eq('following_id', user.id)
              .maybeSingle();
            
            return {
              ...user,
              is_following: !!isFollowing
            };
          })
        );

        setSuggestedUsers(suggestedWithFollowing);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Could not load data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up realtime subscriptions for thoughts
    const thoughtsChannel = supabase
      .channel('public:thoughts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'thoughts' },
        (payload) => {
          console.log('Thoughts change received:', payload);
          fetchInitialData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(thoughtsChannel);
    };
  }, [navigate]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    try {
      const { data, error } = await supabase
        .rpc('search_users', { 
          search_query: query,
          current_user_id: currentUserId
        });

      if (error) throw error;
      setSuggestedUsers(data || []);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: userId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User followed successfully",
      });

      // Update suggested users list
      setSuggestedUsers(prev =>
        prev.map(user => user.id === userId
          ? { ...user, is_following: true }
          : user
        )
      );

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'follow',
          content: 'started following you',
          related_user_id: currentUserId
        });

    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Could not follow user",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/5 pt-20">
      <div className="container max-w-6xl px-4">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search users and thoughts..."
                className="pl-10 pr-4 h-12 text-lg rounded-full border-gray-200 focus:border-primary shadow-sm"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
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
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Suggested Users */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 sticky top-24"
            >
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Suggested Users</h2>
              </div>
              <div className="space-y-4">
                {suggestedUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.full_name}</p>
                      </div>
                    </div>
                    <Button
                      variant={user.is_following ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                      className={user.is_following ? "hover:bg-primary/5" : ""}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
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
