import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  User,
  MessageSquare,
  Link as LinkIcon,
  Briefcase,
  MapPin,
  ExternalLink,
  Clock,
  Award,
  Copy,
  CheckCircle,
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
import { useState } from "react";

// Expandable Description Component
const ExpandableDescription = ({ description }: { description: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p className={clsx(
        "text-sm text-muted-foreground whitespace-pre-line",
        !expanded && "line-clamp-3"
      )}>
        {description}
      </p>
      {description.length > 150 && (
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
  );
};

interface JobListItemProps {
  project: Project;
  hasApplied: boolean;
  onApply: (project: Project) => void;
  featured?: boolean;
}

export const JobListItem = ({
  project,
  hasApplied,
  onApply,
  featured = false
}: JobListItemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return "Expired";
      } else if (diffDays === 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "Tomorrow";
      } else if (diffDays < 7) {
        return `${diffDays} days left`;
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch (e) {
      return dateString;
    }
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && !max) return `₹${min.toLocaleString('en-IN')}+`;
    if (!min && max) return `Up to ₹${max.toLocaleString('en-IN')}`;
    return `₹${min?.toLocaleString('en-IN')} - ₹${max?.toLocaleString('en-IN')}`;
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Job link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <div className={clsx(
      "p-5 relative",
      featured && "bg-gradient-to-r from-primary/5 to-secondary/5"
    )}>
      {featured && (
        <div className="absolute top-0 right-0">
          <Badge
            variant="default"
            className="rounded-bl-md rounded-tr-md rounded-br-none rounded-tl-none bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Award className="h-3 w-3 mr-1" /> Featured
          </Badge>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Left column - Avatar and company info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-background">
            <AvatarImage src={project.author?.avatar_url || ''} alt={project.author?.username || 'Company'} />
            <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10">
              {project.author?.username?.[0]?.toUpperCase() || project.company_name?.[0]?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-2 mt-1">
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
                <span className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-primary/70" />
                  {project.location}
                </span>
              )}

              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1 text-primary/70" />
                {formatDate(project.deadline)}
              </span>
            </div>
          </div>
        </div>

        {/* Right column - Budget */}
        <div className="flex items-center text-sm bg-muted/30 p-2 rounded-md self-start ml-auto">
          <div className="bg-primary/10 p-1.5 rounded-full mr-2">
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Budget</div>
            <div className="text-foreground font-medium">
              {formatBudget(project.min_budget, project.max_budget)}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <ExpandableDescription description={project.description} />
      </div>

      {/* Skills */}
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

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-border flex flex-wrap justify-between items-center gap-3">
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
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
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

        {project.status === "open" && project.author_id !== user?.id && (
          <div className="flex flex-wrap gap-2">
            {/* Application methods */}
            {(project.application_methods?.includes('direct') ||
              project.application_method === 'direct') &&
              project.application_link && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExternalApply}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Apply Externally
                </Button>
              </motion.div>
            )}

            {(project.application_methods?.includes('whatsapp') ||
              project.application_method === 'whatsapp' ||
              (project.allow_whatsapp_apply && project.author?.whatsapp_number)) && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWhatsAppApply}
                  className="gap-1.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="#25D366"
                    stroke="none"
                    className="mr-1"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
              </motion.div>
            )}

            {(project.application_methods?.includes('inbuilt') ||
              project.application_method === 'inbuilt' ||
              project.allow_normal_apply !== false) && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  opacity: { duration: 0.2 }
                }}
              >
                <Button
                  onClick={() => onApply(project)}
                  disabled={hasApplied}
                  size="sm"
                  className={clsx(
                    "gap-1.5 relative overflow-hidden",
                    hasApplied
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  )}
                >
                  {!hasApplied && (
                    <motion.span
                      className="absolute inset-0 bg-white opacity-10"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear"
                      }}
                    />
                  )}
                  {hasApplied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Applied
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Apply Now
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListItem;
