
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, UserMinus, Users, Tag, Badge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PoemCard } from "@/components/PoemCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, Thought } from "@/types";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(5);

      if (error) throw error;

      // Check follow status for each search result
      if (user?.id && data?.length > 0) {
        const userIds = data.map(profile => profile.id);
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', userIds);
        
        const followingMap = new Set(followData?.map(item => item.following_id) || []);
        
        // Add is_following property to each profile
        const profilesWithFollowStatus = data.map(profile => ({
          ...profile,
          is_following: followingMap.has(profile.id)
        }));
        
        setSearchResults(profilesWithFollowStatus);
      } else {
        setSearchResults(data || []);
      }
      
      setShowSearchResults(true);
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

  const handleFollow = async (userId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      const isFollowing = suggestedUsers.find(u => u.id === userId)?.is_following || 
                         searchResults.find(u => u.id === userId)?.is_following;
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        
        // Update local state
        if (showSearchResults) {
          setSearchResults(prevResults => 
            prevResults.map(profile => 
              profile.id === userId 
                ? { ...profile, is_following: false }
                : profile
            )
          );
        }
        
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        
        toast({
          title: "Success",
          description: "You have unfollowed this user",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;
        
        // Update notification for the followed user
        await supabase
          .from('notifications')
          .insert({
            type: 'follow',
            user_id: userId,
            content: 'Someone started following you',
            related_user_id: user.id
          });
        
        // Update local state
        if (showSearchResults) {
          setSearchResults(prevResults => 
            prevResults.map(profile => 
              profile.id === userId 
                ? { ...profile, is_following: true }
                : profile
            )
          );
        }
        
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        
        toast({
          title: "Success",
          description: "You are now following this user",
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const isUserFollowing = (userId: string) => {
    return suggestedUsers.find(u => u.id === userId)?.is_following || 
           searchResults.find(u => u.id === userId)?.is_following || 
           false;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 relative"
        >
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-black mb-4">
              Discover Amazing Thoughts
            </h1>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
              Explore a world of creativity and connect with inspiring minds
            </p>
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 blur-xl opacity-50 -z-10 rounded-full" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 h-14 bg-white/80 backdrop-blur-sm border-gray-300 focus:border-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                />
              </div>
            </div>
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute mt-2 w-full max-w-xl mx-auto inset-x-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2"
            >
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Search Results</h3>
                <div className="divide-y divide-gray-100">
                  {searchResults.map((profile) => (
                    <motion.div
                      key={profile.id}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer" 
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <div className="relative">
                          <img
                            src={profile.avatar_url || "/placeholder.svg"}
                            alt={profile.username}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-black">{profile.username}</p>
                          <p className="text-sm text-gray-500">{profile.full_name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(profile.id)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          profile.is_following 
                            ? "text-red-600 bg-red-50 hover:bg-red-100" 
                            : "text-white bg-black hover:bg-gray-800"
                        }`}
                      >
                        {profile.is_following ? (
                          <>
                            <UserMinus size={12} />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Thoughts */}
          <div className="lg:col-span-2 space-y-6">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-serif font-bold text-black mb-6 border-b border-gray-200 pb-4"
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
              className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 border-2 border-black overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-semibold text-black flex items-center gap-2">
                  <Users size={20} className="text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent">
                    Suggested Connections
                  </span>
                </h3>
                <span className="text-xs font-medium bg-purple-900 text-white px-2 py-1 rounded-full">
                  {suggestedUsers.length}
                </span>
              </div>
              
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
                      className="group relative overflow-hidden flex items-center justify-between gap-4 p-4 rounded-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-purple-200"
                    >
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 to-pink-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-100/50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                      
                      <div 
                        className="flex items-center gap-3 cursor-pointer relative z-10" 
                        onClick={() => navigate(`/profile/${user.id}`)}
                      >
                        <div className="relative overflow-hidden rounded-full">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-0 group-hover:opacity-30 transition-opacity" />
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.username}
                            className="relative w-12 h-12 rounded-full object-cover border-2 border-white group-hover:scale-110 transition-all duration-300"
                          />
                          {user.is_following && (
                            <div className="absolute bottom-0 right-0 bg-purple-600 text-white p-0.5 rounded-full">
                              <Badge size={10} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-black group-hover:text-purple-900 transition-colors">
                            {user.username}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mr-1"></span>
                            <span>{user.followers_count} followers</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(user.id)}
                        className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1 group-hover:scale-105 ${
                          user.is_following 
                            ? "text-white bg-red-500 hover:bg-red-600" 
                            : "text-white bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {user.is_following ? (
                          <>
                            <UserMinus size={14} />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {!suggestedUsersLoading && suggestedUsers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-purple-100 text-center">
                  <button 
                    className="text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors"
                    onClick={() => navigate('/explore')}
                  >
                    View all suggested users
                  </button>
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
