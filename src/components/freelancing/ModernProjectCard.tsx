
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  User,
  MessageSquare,
  CheckCircle2,
  Link as LinkIcon,
  Briefcase,
  MapPin,
  ExternalLink,
  Clock,
  Award,
  Copy
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ModernProjectCardProps {
  project: Project;
  hasApplied: boolean;
  onApply: (project: Project) => void;
  featured?: boolean;
}

export const ModernProjectCard = ({
  project,
  hasApplied,
  onApply,
  featured = false
}: ModernProjectCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleWhatsAppApply = () => {
    if (!project.author?.whatsapp_number) return;

    const message = encodeURIComponent(
      `Hi, I'm interested in your job "${project.title}". I found it on CampusCash.`
    );

    window.open(
      `https://wa.me/${project.author.whatsapp_number}?text=${message}`,
      '_blank'
    );
  };

  const handleExternalApply = () => {
    if (!project.application_link) return;
    window.open(project.application_link, '_blank');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url);

    toast({
      description: "Project link copied to clipboard",
    });
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && !max) return `₹${min.toLocaleString()}`;
    if (!min && max) return `Up to ₹${max.toLocaleString()}`;
    return `₹${min?.toLocaleString()} - ₹${max?.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Function to safely render skills
  const renderSkills = () => {
    if (!project.required_skills) return null;

    // Check if required_skills is an array
    if (Array.isArray(project.required_skills)) {
      return project.required_skills.slice(0, 3).map((skill, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-xs font-normal"
        >
          {skill}
        </Badge>
      ));
    } 
    // Check if required_skills is a string that can be split
    else if (typeof project.required_skills === 'string') {
      return project.required_skills.split(',').slice(0, 3).map((skill, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-xs font-normal"
        >
          {skill.trim()}
        </Badge>
      ));
    }
    
    return null;
  };

  // Function to get skills count for the "+X" badge
  const getSkillsCount = () => {
    if (!project.required_skills) return 0;
    
    if (Array.isArray(project.required_skills)) {
      return Math.max(0, project.required_skills.length - 3);
    } 
    else if (typeof project.required_skills === 'string') {
      return Math.max(0, project.required_skills.split(',').length - 3);
    }
    
    return 0;
  };

  return (
    <Card className={clsx(
      "overflow-hidden transition-all duration-300 group hover:shadow-md border-muted/70 relative h-full flex flex-col",
      featured && "ring-2 ring-primary/20 shadow-lg"
    )}>
      {/* Featured badge */}
      {featured && (
        <div className="absolute top-0 right-0 z-10">
          <Badge
            variant="default"
            className="rounded-bl-md rounded-tr-md rounded-br-none rounded-tl-none bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Award className="h-3 w-3 mr-1" /> Featured
          </Badge>
        </div>
      )}

      {/* Decorative elements */}
      {featured && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
      )}

      <CardHeader className="p-4 pb-2 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <div className={clsx(
                "absolute -inset-0.5 rounded-full blur-sm",
                featured ? "bg-gradient-to-r from-primary/40 to-secondary/40" : "bg-gradient-to-r from-primary/20 to-secondary/20"
              )} />
              <Avatar className="h-10 w-10 border-2 border-background relative">
                <AvatarImage src={project.author?.avatar_url || ''} alt={project.author?.username || 'Company'} />
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10">
                  {project.company_name?.[0]?.toUpperCase() || project.author?.username?.[0]?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <h3 className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-1 gap-2">
                <span className="flex items-center">
                  {project.company_name ? (
                    <>
                      <Briefcase className="h-3 w-3 mr-1 text-primary/70" />
                      {project.company_name}
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1 text-primary/70" />
                      {project.author?.username || 'Anonymous'}
                    </>
                  )}
                </span>

                {project.location && (
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-primary/70" />
                    {project.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                {
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300": project.status === "open",
                  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300": project.status === "in_progress",
                  "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300": project.status === "closed"
                }
              )}
            >
              {project.status?.toUpperCase()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 pb-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center text-xs bg-muted/30 p-1.5 rounded">
            <IndianRupee className="h-3 w-3 text-primary mr-1" />
            <span className="truncate">
              {formatBudget(project.min_budget, project.max_budget)}
            </span>
          </div>

          <div className="flex items-center text-xs bg-muted/30 p-1.5 rounded">
            <Calendar className="h-3 w-3 text-primary mr-1" />
            <span className="truncate">
              {formatDate(project.deadline)}
            </span>
          </div>
        </div>

        {/* Skills */}
        {project.required_skills && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {renderSkills()}
              
              {getSkillsCount() > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{getSkillsCount()}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 mt-auto flex justify-between items-center border-t border-border/50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
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

        {project.status === "open" && project.author_id !== user?.id && !hasApplied ? (
          <div className="flex gap-2">
            {project.allow_normal_apply !== false && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onApply(project)}
              >
                Apply
              </Button>
            )}

            {project.author?.whatsapp_number && project.allow_whatsapp_apply !== false && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsAppApply}
                className="gap-1"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            )}
          </div>
        ) : (
          hasApplied && (
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary/30"
              disabled
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Applied
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
};
