import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Hero } from "@/components/home/Hero";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Thought, Project } from "@/types";
import { PoemCard } from "@/components/PoemCard";
import { EnhancedProjectCard } from "@/pages/freelancing/components/EnhancedProjectCard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Briefcase, ArrowRight, Award, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [topPosts, setTopPosts] = useState<Thought[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [userApplications, setUserApplications] = useState<string[]>([]);

  const handleCallToAction = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/auth");
    }
  };

  useEffect(() => {
    const fetchTopPosts = async () => {
      try {
        setLoadingPosts(true);

        // Fetch the 10 most liked posts
        const { data, error } = await supabase
          .rpc('get_most_liked_thoughts', { limit_count: 10 });

        if (error) throw error;

        // Ensure the data includes author information
        if (data && Array.isArray(data)) {
          // First, get all posts with their author information
          const postsWithAuthors = await Promise.all(
            data.map(async (post) => {
              // Get author data
              const { data: authorData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, created_at, updated_at')
                .eq('id', post.author_id)
                .single();

              // Get likes count
              const { count: likesCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('thought_id', post.id);

              // Get comments count
              const { count: commentsCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('thought_id', post.id);

              return {
                ...post,
                author: authorData || {
                  id: post.author_id,
                  username: 'unknown',
                  created_at: post.created_at,
                  updated_at: post.created_at
                },
                _count: {
                  likes: likesCount || 0,
                  comments: commentsCount || 0
                }
              } as Thought;
            })
          );

          setTopPosts(postsWithAuthors);
        } else {
          setTopPosts([]);
        }
      } catch (error) {
        console.error("Error fetching top posts:", error);
        setTopPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    const fetchRecentProjects = async () => {
      try {
        setLoadingProjects(true);

        // Fetch recent projects
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
          .eq('is_featured', false)
          .order('created_at', { ascending: false })
          .limit(6);

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
          })) as Project[];

          setRecentProjects(typedProjects);
        } else {
          setRecentProjects([]);
        }
      } catch (error) {
        console.error("Error fetching recent projects:", error);
        setRecentProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchFeaturedProjects = async () => {
      try {
        setLoadingFeatured(true);

        // Fetch featured projects
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
          .eq('is_featured', true)
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
          })) as Project[];

          setFeaturedProjects(typedProjects);
        } else {
          setFeaturedProjects([]);
        }
      } catch (error) {
        console.error("Error fetching featured projects:", error);
        setFeaturedProjects([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    const fetchUserApplications = async () => {
      if (!user?.id) return;

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

    fetchTopPosts();
    fetchRecentProjects();
    fetchFeaturedProjects();
    fetchUserApplications();
  }, [user?.id]);

  const handleApplyToProject = (project: Project) => {
    if (isAuthenticated) {
      navigate(`/freelancing?projectId=${project.id}`);
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white">
      {/* SEO */}
      <SEO
        title="CampusCash - Learn, Earn, and Connect on Campus"
        description="CampusCash is the ultimate platform for college students to find jobs, freelance opportunities, share thoughts, and connect with peers on campus."
        keywords="campus jobs, college freelancing, student marketplace, campus networking, student gigs, college jobs, campus cash, student opportunities"
      />

      <Hero onActionClick={handleCallToAction} isLoggedIn={isAuthenticated} />

      {/* Top Posts Section */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="w-1.5 h-8 bg-gradient-to-b from-pink-600 to-red-600 rounded-full mr-3"></div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold bg-gradient-to-r from-gray-900 to-pink-900 dark:from-gray-100 dark:to-pink-200 bg-clip-text text-transparent">
              Top Campus Content
            </h2>
          </motion.div>

          <Button
            variant="ghost"
            onClick={() => navigate('/explore')}
            className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center gap-1 text-sm sm:text-base"
          >
            <span>View All</span>
            <ArrowRight size={16} />
          </Button>
        </div>

        {loadingPosts ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-50">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-10 sm:h-12 w-10 sm:w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                    <Skeleton className="h-2 sm:h-3 w-20 sm:w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 sm:h-24 w-full" />
                <div className="flex justify-between mt-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : topPosts.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {topPosts.map((thought, index) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="transform hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
              >
                <PoemCard
                  poem={thought}
                  currentUserId={user?.id || null}
                />

                {/* Show likes and comments count */}
                <div className="flex items-center justify-end gap-4 mt-2 px-4 pb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span>{thought._count?.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>{thought._count?.comments || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No posts found.</p>
          </div>
        )}
      </section>

      {/* Featured Jobs Section */}
      {featuredProjects.length > 0 && (
        <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-900/10">
          <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <div className="w-1.5 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-3"></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold bg-gradient-to-r from-gray-900 to-amber-900 bg-clip-text text-transparent">
                Featured Opportunities
              </h2>
              <Badge variant="outline" className="ml-3 bg-amber-50 text-amber-700 border-amber-200">
                <Award className="h-3 w-3 mr-1" /> Featured
              </Badge>
            </motion.div>

            <Button
              variant="ghost"
              onClick={() => navigate('/freelancing')}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 flex items-center gap-1 text-sm sm:text-base"
            >
              <span>View All</span>
              <ArrowRight size={16} />
            </Button>
          </div>

          {loadingFeatured ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 sm:p-6 bg-white rounded-xl shadow-sm animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-4/5 mb-4" />
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EnhancedProjectCard
                    project={project}
                    hasApplied={userApplications.includes(project.id)}
                    onApply={handleApplyToProject}
                    featured={true}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent Projects Section */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
        <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full mr-3"></div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              Earn on Campus
            </h2>
          </motion.div>

          <Button
            variant="ghost"
            onClick={() => navigate('/freelancing')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1 text-sm sm:text-base"
          >
            <span>View All</span>
            <ArrowRight size={16} />
          </Button>
        </div>

        {loadingProjects ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 sm:p-6 bg-white rounded-xl shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/5 mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EnhancedProjectCard
                  project={project}
                  hasApplied={userApplications.includes(project.id)}
                  onApply={handleApplyToProject}
                  featured={false}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No projects found.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Landing;
