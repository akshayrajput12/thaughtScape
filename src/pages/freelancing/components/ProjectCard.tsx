
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { IndianRupee, User, Calendar, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  currentUserId?: string;
  hasApplied: boolean;
  onApply: (project: Project) => void;
}

export const ProjectCard = ({ project, currentUserId, hasApplied, onApply }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if current user is following the project author
  const checkFollowStatus = async () => {
    if (!user?.id || user.id === project.author?.id) return;

    try {
      const { data } = await supabase
        .from('follows')
        .select()
        .eq('follower_id', user.id)
        .eq('following_id', project.author?.id)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user?.id || !project.author?.id) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', project.author.id);

        setIsFollowing(false);
        toast({
          description: `Unfollowed ${project.author.username}`,
        });
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: project.author.id
          });

        setIsFollowing(true);
        toast({
          description: `Following ${project.author.username}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        variant: "destructive",
        description: "Failed to update follow status",
      });
    }
  };

  // Navigate to messages with the project author
  const handleMessage = () => {
    navigate(`/messages?userId=${project.author?.id}`);
  };

  // View author's profile
  const handleViewProfile = () => {
    navigate(`/profile/${project.author?.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <div className="relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-purple-100/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative space-y-4">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="space-y-1 flex-1">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 line-clamp-2">{project.title}</h3>
              <button 
                onClick={handleViewProfile}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                by {project.author?.full_name || project.author?.username}
              </button>
            </div>
            {project.budget && (
              <div className="flex items-center text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full">
                <IndianRupee className="w-4 h-4 mr-1" />
                {project.budget.toLocaleString()}
              </div>
            )}
          </div>

          <p className="text-gray-600 line-clamp-3">{project.description}</p>

          <div className="flex flex-wrap gap-2">
            {project.required_skills?.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(project.deadline || project.created_at), 'MMM d')}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{project._count?.applications || 0} applied</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {currentUserId !== project.author?.id && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessage}
                    className="hidden sm:flex"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollowToggle}
                    className="hidden sm:flex"
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onApply(project)}
                    disabled={project.status !== "open" || project.author_id === currentUserId || hasApplied}
                  >
                    {hasApplied ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Applied
                      </span>
                    ) : (
                      "Apply Now"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile action buttons */}
          {currentUserId !== project.author?.id && (
            <div className="flex gap-2 sm:hidden mt-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMessage}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFollowToggle}
                className="flex-1"
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
