
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Hero } from "@/components/home/Hero";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Thought, Project } from "@/types";
import { PoemCard } from "@/components/PoemCard";
import { ProjectCard } from "@/pages/freelancing/components/ProjectCard";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Briefcase, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [topPosts, setTopPosts] = useState<Thought[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
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
              const { data: authorData } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, created_at, updated_at')
                .eq('id', post.author_id)
                .single();
              
              return {
                ...post,
                author: authorData || {
                  id: post.author_id,
                  username: 'unknown',
                  created_at: post.created_at,
                  updated_at: post.created_at
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
              whatsapp_number
            )
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;

        // Ensure the status is properly cast to the expected type
        if (data) {
          const typedProjects = data.map(project => ({
            ...project,
            status: project.status as "open" | "closed" | "in_progress"
          }));
          
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold bg-gradient-to-r from-gray-900 to-pink-900 bg-clip-text text-transparent">
              Top Campus Content
            </h2>
          </motion.div>

          <Button
            variant="ghost"
            onClick={() => navigate('/explore')}
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 flex items-center gap-1 text-sm sm:text-base"
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
                  <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded-full" />
                  <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded-full" />
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
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No posts found.</p>
          </div>
        )}
      </section>

      {/* Recent Projects Section */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-white to-blue-50/30">
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
                <Skeleton className="h-5 sm:h-6 w-2/3 mb-3 sm:mb-4" />
                <Skeleton className="h-3 sm:h-4 w-full mb-2" />
                <Skeleton className="h-3 sm:h-4 w-5/6" />
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
                <ProjectCard
                  project={project}
                  hasApplied={userApplications.includes(project.id)}
                  onApply={handleApplyToProject}
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
