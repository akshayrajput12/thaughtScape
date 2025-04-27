
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Thought, Profile, Project } from "@/types";
import { Loader2, UserPlus, UserMinus, Briefcase, MessageSquare, Bell, Sparkles } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import JobListItem from "@/components/explore/JobListItem";
import SEO from "@/components/SEO";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("feed");
  const [userApplications, setUserApplications] = useState<string[]>([]);

  // Fetch thoughts/posts
  const { data: thoughts, isLoading: isLoadingThoughts } = useQuery({
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
        .limit(10);

      if (error) throw error;
      return data as unknown as Thought[];
    }
  });

  // Fetch projects/jobs
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            whatsapp_number,
            created_at,
            updated_at
          ),
          applications:project_applications(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Ensure the status is properly cast to the expected type
      if (data) {
        const typedProjects = data.map(project => ({
          ...project,
          // Keep both min_budget and max_budget for proper budget display
          min_budget: project.min_budget,
          max_budget: project.max_budget,
          // For backward compatibility
          budget: project.min_budget,
          _count: {
            applications: project.applications?.[0]?.count || 0,
            comments: 0
          },
          status: project.status as "open" | "closed" | "in_progress"
        }));

        return typedProjects as Project[];
      }

      return [] as Project[];
    }
  });

  // Fetch user applications
  useEffect(() => {
    const fetchUserApplications = async () => {
      if (!user?.id) {
        setUserApplications([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('project_applications')
          .select('project_id')
          .eq('applicant_id', user.id);

        if (error) throw error;

        setUserApplications(data.map(app => app.project_id));
      } catch (error) {
        console.error("Error fetching user applications:", error);
      }
    };

    fetchUserApplications();
  }, [user?.id]);

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

  const handleApplyToProject = (project: Project) => {
    if (!user) {
      navigate('/auth', { state: { from: '/home' } });
      return;
    }

    navigate(`/project/${project.id}`);
  };

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

  const isLoading = isLoadingThoughts || isLoadingProjects;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {/* Page-specific SEO */}
      <SEO
        title="Home | CampusCash"
        description="Your personalized feed of campus posts, job opportunities, and connections."
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed - Center Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="bg-gradient-to-r from-primary to-secondary p-3 rounded-full">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-medium text-lg">Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!</h2>
                  <p className="text-muted-foreground text-sm">Check out the latest posts and job opportunities</p>
                </div>
              </motion.div>

              {/* Tabs for Feed and Jobs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="feed" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Feed</span>
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Jobs</span>
                    {projects && projects.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center">
                        {projects.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="feed" className="space-y-6">
                  {thoughts?.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium text-foreground mb-2">No posts yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Follow more users to see their posts in your feed, or explore the latest thoughts from the community.
                      </p>
                      <Button onClick={() => navigate('/explore')}>
                        Explore Posts
                      </Button>
                    </div>
                  ) : (
                    thoughts?.map((thought, index) => (
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
                    ))
                  )}
                </TabsContent>

                <TabsContent value="jobs" className="space-y-6">
                  {projects?.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-medium text-foreground mb-2">No jobs available</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        There are no job opportunities available at the moment. Check back later or explore all jobs.
                      </p>
                      <Button onClick={() => navigate('/freelancing')}>
                        View All Jobs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects?.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-card hover:bg-card/80 border border-border hover:border-primary/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <JobListItem
                            project={project}
                            hasApplied={userApplications.includes(project.id)}
                            onApply={handleApplyToProject}
                            featured={project.is_featured}
                          />
                        </motion.div>
                      ))}

                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() => navigate('/freelancing')}
                          className="w-full"
                        >
                          View All Jobs
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
