import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, UserMinus, Users, Tag, Badge, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PoemCard } from "@/components/PoemCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, Thought, Project } from "@/types";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedProjectsList } from "@/components/freelancing/components/EnhancedProjectsList";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, created_at, updated_at)
        `)
        .eq("is_featured", true)
        .limit(3);

      if (error) throw error;

      const mappedProjects = data.map(project => ({
        ...project,
        budget: project.min_budget || 0,
        category: project.job_type || "other",
        status: (project.status || 'open') as "open" | "closed" | "in_progress"
      })) as Project[];

      setFeaturedProjects(mappedProjects);
      return mappedProjects;
    }
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

      if (user?.id && data?.length > 0) {
        const userIds = data.map(profile => profile.id);
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', userIds);

        const followingMap = new Set(followData?.map(item => item.following_id) || []);

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
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        if (showSearchResults) {
          setSearchResults(prevResults =>
            prevResults.map(profile =>
              profile.id === userId
                ? { ...profile, is_following: false }
                : profile
            )
          );
        }

        queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });

        toast({
          title: "Success",
          description: "You have unfollowed this user",
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;

        await supabase
          .from('notifications')
          .insert({
            type: 'follow',
            user_id: userId,
            content: 'Someone started following you',
            related_user_id: user.id
          });

        if (showSearchResults) {
          setSearchResults(prevResults =>
            prevResults.map(profile =>
              profile.id === userId
                ? { ...profile, is_following: true }
                : profile
            )
          );
        }

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-16 relative"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
            <div className="inline-block mb-2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Explore
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground px-2">
              Discover Campus Opportunities
            </h1>
            <p className="text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto text-base md:text-lg px-4">
              Learn, earn, and connect with fellow students on your campus
            </p>
            <div className="relative max-w-2xl mx-auto px-2">
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl opacity-60 hidden md:block dark:bg-primary/10" />
              <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-primary/20 rounded-full blur-xl opacity-60 hidden md:block dark:bg-primary/10" />

              <div className="relative bg-card/80 backdrop-blur-md rounded-xl md:rounded-2xl p-2 shadow-lg md:shadow-xl border border-border">
                <Search className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 md:h-5 w-4 md:w-5" />
                <Input
                  type="text"
                  placeholder="Search users or thoughts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 md:pl-12 h-12 md:h-14 bg-transparent border-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg md:rounded-xl text-base md:text-lg"
                />
              </div>
            </div>
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute mt-2 md:mt-4 w-full max-w-2xl mx-auto inset-x-0 bg-card/90 backdrop-blur-md border border-border rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl z-50 p-3 md:p-4"
            >
              <div className="p-1 md:p-2">
                <h3 className="text-xs md:text-sm font-medium text-primary mb-2 md:mb-4 flex items-center">
                  <Users size={14} className="mr-1 md:mr-2" />
                  Search Results
                </h3>
                <div className="divide-y divide-border">
                  {searchResults.map((profile) => (
                    <motion.div
                      key={profile.id}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between p-2 md:p-4 hover:bg-muted/50 rounded-lg md:rounded-xl transition-all duration-300"
                    >
                      <div
                        className="flex items-center gap-2 md:gap-4 cursor-pointer flex-1 min-w-0"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-background">
                            <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                            <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-foreground text-sm md:text-base truncate">{profile.username}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{profile.full_name}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFollow(profile.id)}
                        variant={profile.is_following ? "destructive" : "default"}
                        size="sm"
                        className="ml-2 flex-shrink-0"
                      >
                        {profile.is_following ? (
                          <>
                            <UserMinus size={12} className="mr-1 hidden sm:inline" />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} className="mr-1 hidden sm:inline" />
                            <span>Follow</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="mt-8">
          <Tabs defaultValue="posts" className="w-full" onValueChange={handleTabChange}>
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
              </TabsList>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="mb-6 p-4 bg-card rounded-lg border border-border">
                <div className="flex flex-wrap gap-4">
                  <select
                    className="px-3 py-2 rounded-md border border-border bg-background"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="technology">Technology</option>
                    <option value="design">Design</option>
                    <option value="writing">Writing</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
              </div>
            )}

            <TabsContent value="posts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <div className="flex items-center justify-between">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center"
                    >
                      <div className="w-1 md:w-1.5 h-6 md:h-8 bg-primary rounded-full mr-2 md:mr-3"></div>
                      <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground">
                        Campus Buzz
                      </h2>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground"
                    >
                      <Tag size={14} className="md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Popular now</span>
                      <span className="sm:hidden">Popular</span>
                    </motion.div>
                  </div>

                  {thoughts.length === 0 ? (
                    <div className="space-y-4 md:space-y-8">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md md:shadow-lg border border-border">
                          <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                            <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
                            <div className="space-y-1 md:space-y-2">
                              <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
                              <Skeleton className="h-2 md:h-3 w-16 md:w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-16 md:h-24 w-full" />
                          <div className="flex justify-between mt-3 md:mt-4">
                            <Skeleton className="h-6 md:h-8 w-16 md:w-20 rounded-full" />
                            <Skeleton className="h-6 md:h-8 w-16 md:w-20 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {thoughts.map((thought, index) => (
                        <motion.div
                          key={thought.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
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

                <div className="space-y-6 md:space-y-8">
                  <div className="lg:hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Users size={16} className="text-primary" />
                        <h3 className="text-base font-serif font-semibold text-foreground">
                          People to Follow
                        </h3>
                      </div>
                      <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {suggestedUsers.length}
                      </span>
                    </div>

                    {suggestedUsersLoading ? (
                      <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex-shrink-0 w-40 bg-card rounded-xl p-4 shadow-md border border-border">
                            <div className="flex flex-col items-center text-center space-y-3">
                              <Skeleton className="h-16 w-16 rounded-full" />
                              <div className="space-y-1 w-full">
                                <Skeleton className="h-3 w-20 mx-auto" />
                                <Skeleton className="h-2 w-16 mx-auto" />
                              </div>
                              <Skeleton className="h-8 w-full rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
                        {suggestedUsers.map((user: Profile, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex-shrink-0 w-40 bg-card rounded-xl p-4 shadow-md border border-border hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex flex-col items-center text-center space-y-3">
                              <div
                                className="cursor-pointer"
                                onClick={() => navigate(`/profile/${user.id}`)}
                              >
                                <div className="relative">
                                  <Avatar className="w-16 h-16">
                                    <AvatarImage src={user.avatar_url || ""} alt={user.username} />
                                    <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  {user.is_following && (
                                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full shadow-sm">
                                      <Badge size={8} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="w-full">
                                <p className="font-medium text-foreground truncate text-sm">
                                  {user.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.followers_count || 0} followers
                                </p>
                              </div>
                              <Button
                                onClick={() => handleFollow(user.id)}
                                variant={user.is_following ? "destructive" : "default"}
                                size="sm"
                                className="w-full"
                              >
                                {user.is_following ? "Unfollow" : "Follow"}
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block lg:sticky lg:top-24">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-card rounded-2xl shadow-xl p-6 border border-border overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users size={18} className="text-primary" />
                            <h3 className="text-lg font-serif font-semibold text-foreground">
                              People to Follow
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground">Discover creative minds</p>
                        </div>
                        <span className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full">
                          {suggestedUsers.length}
                        </span>
                      </div>

                      {suggestedUsersLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-2">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-2 w-16" />
                              </div>
                              <Skeleton className="h-8 w-20 rounded-full" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {suggestedUsers.map((user: Profile, index) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group relative overflow-hidden flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-300"
                            >
                              <div className="absolute -right-6 -bottom-6 w-12 h-12 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 dark:bg-primary/5"></div>
                              <div className="absolute -left-6 -top-6 w-12 h-12 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 dark:bg-primary/5"></div>

                              <div
                                className="flex items-center gap-3 cursor-pointer relative z-10 min-w-0 flex-1"
                                onClick={() => navigate(`/profile/${user.id}`)}
                              >
                                <div className="relative overflow-hidden rounded-full flex-shrink-0">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={user.avatar_url || ""} alt={user.username} />
                                    <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  {user.is_following && (
                                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full shadow-sm">
                                      <Badge size={8} />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                    {user.username}
                                  </p>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-1"></span>
                                    <span className="truncate">{user.followers_count || 0} followers</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollow(user.id);
                                }}
                                variant={user.is_following ? "destructive" : "default"}
                                size="sm"
                                className="relative z-10"
                              >
                                {user.is_following ? (
                                  <>
                                    <UserMinus size={12} className="mr-1" />
                                    <span>Unfollow</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={12} className="mr-1" />
                                    <span>Follow</span>
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {!suggestedUsersLoading && suggestedUsers.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-border text-center">
                          <Button variant="link" className="text-primary">
                            <span>Discover more people</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-card rounded-2xl shadow-xl p-6 border border-border mt-6"
                    >
                      <h3 className="text-lg font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Tag size={18} className="text-primary" />
                        Popular Topics
                      </h3>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {['Poetry', 'Fiction', 'Philosophy', 'Science', 'Art', 'Music', 'Technology'].map((topic, index) => (
                          <motion.span
                            key={topic}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-3 py-1.5 bg-muted text-foreground text-sm font-medium rounded-full cursor-pointer hover:bg-primary/10 transition-colors"
                          >
                            {topic}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  <div className="lg:hidden">
                    <div className="flex items-center gap-1 mb-3">
                      <Tag size={16} className="text-primary" />
                      <h3 className="text-base font-serif font-semibold text-foreground">
                        Popular Topics
                      </h3>
                    </div>

                    <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
                      {['Poetry', 'Fiction', 'Philosophy', 'Science', 'Art', 'Music', 'Technology'].map((topic, index) => (
                        <motion.span
                          key={topic}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex-shrink-0 px-3 py-1.5 bg-muted text-foreground text-sm font-medium rounded-full cursor-pointer hover:bg-primary/10 transition-colors whitespace-nowrap"
                        >
                          {topic}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <EnhancedProjectsList
                projects={projects.filter(project => {
                  if (categoryFilter !== 'all') {
                    return project.category === categoryFilter;
                  }
                  return true;
                })}
                isLoading={projectsLoading}
                showApplyButton={true}
                onProjectClick={(id) => navigate(`/projects/${id}`)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Explore;
