
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { IndianRupee, User, Calendar, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  currentUserId?: string;
  hasApplied: boolean;
  onApply: (project: Project) => void;
}

export const ProjectCard = ({ project, currentUserId, hasApplied, onApply }: ProjectCardProps) => {
  const navigate = useNavigate();
  
  // Function to navigate to author's profile
  const handleViewProfile = () => {
    if (project.author?.id) {
      navigate(`/profile/${project.author.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group h-full"
    >
      <div className="relative h-full bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-purple-100/50 overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex-1 flex flex-col space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1 flex-1">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                {project.title}
              </h3>
              <button 
                onClick={handleViewProfile}
                className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1"
              >
                <span>by {project.author?.full_name || project.author?.username}</span>
              </button>
            </div>
            {project.budget && (
              <div className="flex items-center text-green-600 font-medium text-xs sm:text-sm bg-green-50 px-2 py-1 rounded-full">
                <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {project.budget.toLocaleString()}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-3 flex-grow">{project.description}</p>

          <div className="flex flex-wrap gap-1 sm:gap-2 my-2">
            {project.required_skills?.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{format(new Date(project.deadline || project.created_at), 'MMM d')}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{project._count?.applications || 0} applied</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{project._count?.comments || 0} comments</span>
              </div>
            </div>
            
            <Button
              variant={hasApplied ? "secondary" : "default"}
              size="sm"
              onClick={() => onApply(project)}
              disabled={project.status !== "open" || project.author_id === currentUserId || hasApplied}
              className="ml-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              {hasApplied ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Applied</span>
                </span>
              ) : (
                "Apply Now"
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
