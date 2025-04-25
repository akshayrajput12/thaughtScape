
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  User,
  MessageSquare,
  CheckCircle2,
  Link as LinkIcon,
  Github,
  Linkedin,
  Instagram,
  Twitter
} from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import type { Project } from '@/types';
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export interface ProjectCardProps {
  project: Project;
  hasApplied: boolean;
  onApply: (project: Project) => void;
}

export const ProjectCard = ({ project, hasApplied, onApply }: ProjectCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleWhatsAppApply = () => {
    if (!project.author?.whatsapp_number) return;

    const message = encodeURIComponent(
      `Hi, I'm interested in your project "${project.title}". I found it on the freelancing platform.`
    );

    window.open(
      `https://wa.me/${project.author.whatsapp_number}?text=${message}`,
      '_blank'
    );
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url);

    toast({
      description: "Project link copied to clipboard",
    });
  };

  const renderSocialLinks = () => {
    const socialLinks = [
      {
        url: project.author?.instagram_url,
        icon: <Instagram className="h-4 w-4 text-pink-500" />,
        name: "Instagram"
      },
      {
        url: project.author?.linkedin_url,
        icon: <Linkedin className="h-4 w-4 text-blue-500" />,
        name: "LinkedIn"
      },
      {
        url: project.author?.twitter_url,
        icon: <Twitter className="h-4 w-4 text-sky-500" />,
        name: "Twitter"
      },
      {
        url: project.attachment_url,
        icon: <LinkIcon className="h-4 w-4 text-gray-500" />,
        name: "Project Link"
      }
    ];

    return (
      <div className="flex items-center space-x-2 mt-2">
        {socialLinks.map((link, index) => (
          link.url && (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    {link.icon}
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View {link.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        ))}
      </div>
    );
  };

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
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm truncate">
              Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm truncate">
              Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span className="text-sm truncate">
            Posted by: {project.author?.full_name || project.author?.username}
          </span>
        </div>

        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {project.required_skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium",
                {
                  "bg-green-100 text-green-800": project.status === "open",
                  "bg-yellow-100 text-yellow-800": project.status === "in_progress",
                  "bg-gray-100 text-gray-800": project.status === "closed"
                }
              )}
            >
              {project.status?.toUpperCase()}
            </span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyLink}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy project link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {project.status === "open" && project.author_id !== user?.id && !hasApplied ? (
            <div className="flex flex-wrap gap-2">
              {project.allow_normal_apply !== false && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onApply(project)}
                >
                  Apply Now
                </Button>
              )}

              {project.author?.whatsapp_number && project.allow_whatsapp_apply !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppApply}
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

        {renderSocialLinks()}
      </div>
    </div>
  );
};
