
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Thought, Profile } from "@/types";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { PoemCard } from "@/components/PoemCard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: thoughts, isLoading } = useQuery({
    queryKey: ['thoughts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thoughts')
        .select(`
          *,
          author:profiles!thoughts_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as unknown as Thought[];
    }
  });

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user?.id) return;

      try {
        setLoadingSuggestions(true);

        // Get users the current user is not following
        const { data, error } = await supabase
          .rpc('get_suggested_users', { user_id: user.id })
          .limit(5);

        if (error) throw error;

        // Check follow status for each suggested user
        if (data?.length > 0) {
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

          setSuggestedUsers(profilesWithFollowStatus);
        } else {
          setSuggestedUsers(data || []);
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestedUsers();
  }, [user?.id]);

  const handleFollow = async (userId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const isFollowing = suggestedUsers.find(u => u.id === userId)?.is_following;

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        // Update local state
        setSuggestedUsers(prevUsers =>
          prevUsers.map(profile =>
            profile.id === userId
              ? { ...profile, is_following: false }
              : profile
          )
        );

        // Invalidate queries to refetch data
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
        setSuggestedUsers(prevUsers =>
          prevUsers.map(profile =>
            profile.id === userId
              ? { ...profile, is_following: true }
              : profile
          )
        );

        // Invalidate queries to refetch data
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

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed - Center Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Posts Feed */}
              <div className="space-y-6">
                {thoughts?.map((thought, index) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PoemCard
                      poem={thought}
                      currentUserId={user?.id}
                      isAdmin={false}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block space-y-6">
              {/* User Profile Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user?.user_metadata?.full_name || user?.email}</p>
                    <p className="text-sm text-muted-foreground">@{user?.user_metadata?.username || 'user'}</p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="text-primary">
                  Switch
                </Button>
              </div>

              <Separator />

              {/* Suggested Users */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-foreground font-medium">Suggested for you</h3>
                  <Button variant="link" size="sm" className="text-primary">
                    See All
                  </Button>
                </div>

                <div className="space-y-4">
                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    suggestedUsers.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between group hover:bg-muted/50 p-2 rounded-lg transition-all duration-300"
                      >
                        <div
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-background group-hover:border-primary/20 transition-all duration-300">
                              <AvatarImage src={profile.avatar_url || ''} />
                              <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {profile.is_following && (
                              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-0.5 rounded-full shadow-sm">
                                <div className="w-2 h-2 rounded-full" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{profile.username}</p>
                            <p className="text-xs text-muted-foreground">Suggested for you</p>
                          </div>
                        </div>
                        <Button
                          variant={profile.is_following ? "destructive" : "default"}
                          size="sm"
                          className="opacity-80 group-hover:opacity-100"
                          onClick={() => handleFollow(profile.id)}
                        >
                          {profile.is_following ? "Unfollow" : "Follow"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Footer Links */}
              <div className="text-xs text-muted-foreground space-y-4">
                <div className="flex flex-wrap gap-2">
                  <a href="#" className="hover:underline">About</a>
                  <span>•</span>
                  <a href="#" className="hover:underline">Help</a>
                  <span>•</span>
                  <a href="#" className="hover:underline">Privacy</a>
                  <span>•</span>
                  <a href="#" className="hover:underline">Terms</a>
                  <span>•</span>
                  <a href="#" className="hover:underline">Contact</a>
                </div>
                <p>© 2023 CampusCash</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Home;
