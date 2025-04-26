
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Twitter,
  Copy,
  ExternalLink
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
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

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
      title: "Success",
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
        url: project.author?.portfolio_url,
        icon: <ExternalLink className="h-4 w-4 text-purple-500" />,
        name: "Portfolio"
      },
      {
        url: project.attachment_url,
        icon: <LinkIcon className="h-4 w-4 text-gray-500" />,
        name: "Project Link"
      }
    ];

    return (
      <div className="flex items-center space-x-2 mt-3">
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
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 h-8 w-8"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy project link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 mb-2">
              {project.title}
            </h3>
            
            <Badge 
              className={clsx(
                "px-2 py-1 font-medium",
                {
                  "bg-green-100 text-green-800": project.status === "open",
                  "bg-yellow-100 text-yellow-800": project.status === "in_progress",
                  "bg-gray-100 text-gray-800": project.status === "closed"
                }
              )}
            >
              {project.status?.toUpperCase()}
            </Badge>
          </div>
          
          {project.is_featured && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-3">
        <p className="text-gray-600 line-clamp-3 mb-4">
          {project.description}
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm truncate">
                {project.deadline 
                  ? `Deadline: ${format(new Date(project.deadline), 'PP')}` 
                  : 'No deadline'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <span className="text-sm truncate font-medium">
                {project.budget 
                  ? `₹${project.budget.toLocaleString('en-IN')}` 
                  : project.min_budget && project.max_budget 
                    ? `₹${project.min_budget.toLocaleString('en-IN')} - ₹${project.max_budget.toLocaleString('en-IN')}`
                    : 'Budget not specified'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm">
              Posted by: <span className="font-medium">{project.author?.full_name || project.author?.username}</span>
            </span>
          </div>

          {project.required_skills && project.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {project.required_skills.map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {renderSocialLinks()}
      </CardContent>

      <CardFooter className="px-5 py-4 border-t border-gray-100 flex justify-end">
        {project.status === "open" && project.author_id !== user?.id && !hasApplied ? (
          <div className="flex flex-wrap gap-2">
            {project.allow_normal_apply !== false && (
              <Button
                onClick={() => onApply(project)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Apply Now
              </Button>
            )}

            {project.author?.whatsapp_number && project.allow_whatsapp_apply !== false && (
              <Button
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
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
              className="text-blue-600 border-blue-600"
              disabled
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Applied
            </Button>
          )
        )}
        
        {!user && (
          <Button
            variant="secondary"
            onClick={() => window.location.href = "/auth/login"}
          >
            Login to Apply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
