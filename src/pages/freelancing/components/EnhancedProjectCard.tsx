import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  User,
  MessageSquare,
  CheckCircle2,
  Link as LinkIcon,
  Linkedin,
  Instagram,
  Twitter,
  Briefcase,
  MapPin,
  ExternalLink,
  Clock,
  Award,
  ChevronDown,
  ChevronUp
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface EnhancedProjectCardProps {
  project: Project;
  hasApplied: boolean;
  onApply: (project: Project) => void;
  featured?: boolean;
}

export const EnhancedProjectCard = ({
  project,
  hasApplied,
  onApply,
  featured = false
}: EnhancedProjectCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const handleWhatsAppApply = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for this job",
        variant: "destructive",
      });
      return;
    }

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
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for this job",
        variant: "destructive",
      });
      return;
    }

    if (!project.application_link) return;
    window.open(project.application_link, '_blank');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url);

    toast({
      description: "Job link copied to clipboard",
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

  const getJobTypeColor = (jobType?: string) => {
    switch (jobType?.toLowerCase()) {
      case 'full-time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'part-time': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'contract': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'freelance': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'internship': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getExperienceLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'entry':
      case 'beginner':
      case 'entry-level': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expert':
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'senior': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderSocialLinks = () => {
    if (!project.author) return null;

    const socialLinks = [
      {
        name: "LinkedIn",
        url: project.author.linkedin_url,
        icon: <Linkedin className="h-4 w-4" />
      },
      {
        name: "Instagram",
        url: project.author.instagram_url,
        icon: <Instagram className="h-4 w-4" />
      },
      {
        name: "Twitter",
        url: project.author.twitter_url,
        icon: <Twitter className="h-4 w-4" />
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
                    className="hover:bg-muted p-2 rounded-full transition-colors"
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
    <Card className={clsx(
      "overflow-hidden transition-all duration-300 group hover:shadow-md border-border relative",
      featured && "ring-2 ring-primary/20 shadow-lg"
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-card/50 via-card to-card/80 opacity-50" />

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

      {featured && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-secondary/80 to-primary/80" />
      )}

      <CardHeader className="p-5 pb-3 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <div className={clsx(
                "absolute -inset-0.5 rounded-full blur-sm",
                featured ? "bg-gradient-to-r from-primary/40 to-secondary/40" : "bg-gradient-to-r from-primary/20 to-secondary/20"
              )} />
              <Avatar className="h-12 w-12 border-2 border-background relative">
                <AvatarImage src={project.author?.avatar_url || ''} alt={project.author?.username || 'Company'} />
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10">
                  {project.author?.username?.[0]?.toUpperCase() || project.company_name?.[0]?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span className="flex items-center">
                  {project.company_name ? (
                    <>
                      <Briefcase className="h-3.5 w-3.5 mr-1 text-primary/70" />
                      {project.company_name}
                    </>
                  ) : (
                    <>
                      <User className="h-3.5 w-3.5 mr-1 text-primary/70" />
                      {project.author?.username || 'Anonymous'}
                    </>
                  )}
                </span>

                {project.location && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-primary/70" />
                      {project.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={clsx(
                "px-2.5 py-1 rounded-full text-xs font-medium shadow-sm",
                {
                  "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900 dark:to-emerald-900 dark:text-green-300": project.status === "open",
                  "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900 dark:to-amber-900 dark:text-yellow-300": project.status === "in_progress",
                  "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900 dark:to-slate-900 dark:text-gray-300": project.status === "closed"
                }
              )}
            >
              {project.status?.toUpperCase()}
            </span>

            {project.job_type && (
              <span className={clsx(
                "mt-2 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm",
                getJobTypeColor(project.job_type)
              )}>
                {project.job_type}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 pb-3 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-secondary/5 opacity-50" />
          <div className="relative p-2 rounded-md">
            <p className={clsx(
              "text-sm text-muted-foreground whitespace-pre-line",
              !expanded && "line-clamp-3"
            )}>
              {project.description}
            </p>
            {project.description && project.description.length > 150 && (
              <Button
                variant={expanded ? "ghost" : "secondary"}
                size="sm"
                className={clsx(
                  "mt-2 h-8 text-xs px-4 font-medium shadow-sm",
                  expanded
                    ? "text-muted-foreground hover:text-foreground"
                    : "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 hover:from-blue-600 hover:to-indigo-600 text-white dark:from-blue-600/90 dark:to-indigo-600/90"
                )}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                    Read More
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 mt-5">
          <div className="flex items-center text-sm bg-muted/30 p-2 rounded-md">
            <div className="bg-primary/10 p-1.5 rounded-full mr-2">
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Salary</div>
              <div className="text-foreground font-medium">
                {formatBudget(project.min_budget, project.max_budget)}
              </div>
            </div>
          </div>

          <div className="flex items-center text-sm bg-muted/30 p-2 rounded-md">
            <div className="bg-primary/10 p-1.5 rounded-full mr-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Deadline</div>
              <div className="text-foreground">
                {formatDate(project.application_deadline || project.deadline)}
              </div>
            </div>
          </div>

          {project.experience_level && (
            <div className="flex items-center text-sm bg-muted/30 p-2 rounded-md">
              <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Experience</div>
                <div className={clsx(
                  "text-foreground font-medium",
                  getExperienceLevelColor(project.experience_level).replace("bg-", "text-").replace(/dark:.+/, "")
                )}>
                  {project.experience_level}
                </div>
              </div>
            </div>
          )}

          {project._count && (
            <div className="flex items-center text-sm bg-muted/30 p-2 rounded-md">
              <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Applicants</div>
                <div className="text-foreground">
                  {project._count.applications || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {project.required_skills && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(Array.isArray(project.required_skills)
              ? project.required_skills
              : [project.required_skills]).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs py-0.5">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <Separator className="bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

      <CardFooter className="p-4 flex flex-wrap justify-between items-center gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy job link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-xs text-muted-foreground">
            Posted {format(new Date(project.created_at), "MMM d")}
          </span>
        </div>

        {project.status === "open" && project.author_id !== user?.id && !hasApplied ? (
          <div className="flex flex-wrap gap-2">
            {project.application_link && (
              <Button
                variant="default"
                size="sm"
                onClick={handleExternalApply}
                className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Apply Externally
              </Button>
            )}

            {project.allow_normal_apply !== false && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Authentication Required",
                      description: "Please sign in to apply for this job",
                      variant: "destructive",
                    });
                    return;
                  }
                  onApply(project);
                }}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm"
              >
                Apply Now
              </Button>
            )}

            {project.author?.whatsapp_number && project.allow_whatsapp_apply !== false && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsAppApply}
                className="gap-1.5 border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-500/20 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300"
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
              className="text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
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
