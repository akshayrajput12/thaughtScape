
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, IndianRupee, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import type { Project } from '@/types';
import { useAuth } from "@/components/auth/AuthProvider";

export interface ProjectCardProps {
  project: Project;
  hasApplied: boolean;
  onApply: (project: Project) => void;
}

export const ProjectCard = ({ project, hasApplied, onApply }: ProjectCardProps) => {
  const { user } = useAuth();
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3">
          {project.description}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <IndianRupee className="w-4 h-4" />
          <span className="text-sm">Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span className="text-sm">{project.author?.full_name || project.author?.username}</span>
        </div>
        
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {project.required_skills.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 flex flex-wrap gap-2 border-t border-gray-100">
        <div className="w-full flex flex-wrap justify-between items-center">
          <span className={clsx(
            "px-3 py-1 rounded-full text-xs font-medium",
            {
              "bg-green-100 text-green-800": project.status === "open",
              "bg-yellow-100 text-yellow-800": project.status === "in_progress",
              "bg-gray-100 text-gray-800": project.status === "closed"
            }
          )}>
            {project.status?.toUpperCase()}
          </span>
          
          {project.status === "open" && project.author_id !== user?.id && !hasApplied ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onApply(project)}
              >
                Apply Now
              </Button>
              
              {project.author?.whatsapp_number && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Hi, I'm interested in your project "${project.title}". I found it on the freelancing platform.`
                    );
                    window.open(
                      `https://wa.me/${project.author.whatsapp_number}?text=${message}`,
                      '_blank'
                    );
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Apply via WhatsApp
                </Button>
              )}
            </div>
          ) : (
            hasApplied && (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600"
                disabled
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Applied
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
