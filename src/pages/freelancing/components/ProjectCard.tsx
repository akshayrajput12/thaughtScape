
import { motion } from "framer-motion";
import { format } from "date-fns";
import { IndianRupee, User, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  currentUserId?: string;
  hasApplied: boolean;
  onApply: (project: Project) => void;
}

export const ProjectCard = ({ project, currentUserId, hasApplied, onApply }: ProjectCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <div className="relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-purple-100/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="text-xl font-serif font-semibold text-gray-900 line-clamp-2">{project.title}</h3>
              <p className="text-sm text-gray-600">by {project.author?.full_name || project.author?.username}</p>
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
                className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(project.deadline || project.created_at), 'MMM d')}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{project._count?.applications || 0} applied</span>
              </div>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onApply(project)}
              disabled={project.status !== "open" || project.author_id === currentUserId || hasApplied}
              className="ml-2"
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};
