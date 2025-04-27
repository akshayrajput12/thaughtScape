
import React from 'react';
import { Project } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, CalendarIcon, MapPinIcon, Clock, Check, Star } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface EnhancedProjectCardProps {
  project: Project;
  hasApplied?: boolean;
  onApply: (project: Project) => void;
  featured?: boolean;
}

export const EnhancedProjectCard = ({ project, hasApplied = false, onApply, featured = false }: EnhancedProjectCardProps) => {
  // Format the date
  const formattedDate = project.created_at 
    ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true })
    : 'recently';
    
  // Get the application count
  const applicationsCount = typeof project.applications_count === 'number' 
    ? project.applications_count 
    : project._count?.applications || 0;
  
  // Get the milestones count
  const milestonesCount = typeof project.milestones_count === 'number'
    ? project.milestones_count
    : project._count?.milestones || 0;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${featured ? 'border-2 border-primary' : ''}`}>
      {featured && (
        <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 flex items-center justify-center">
          <Star className="h-3 w-3 mr-1" />
          Featured Project
        </div>
      )}
      
      <CardHeader className="p-4">
        <div className="flex gap-3 items-center">
          <Avatar className="h-10 w-10 border border-border">
            {project.author?.avatar_url ? (
              <AvatarImage src={project.author.avatar_url} alt={project.author.username || "User"} />
            ) : (
              <AvatarFallback>
                {(project.author?.username?.[0] || project.author?.full_name?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium text-lg line-clamp-1">{project.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{project.author?.username || "Anonymous"}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <p className="text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {project.required_skills?.slice(0, 3).map((skill, index) => (
            <Badge key={index} variant="outline" className="bg-primary/5">
              {skill}
            </Badge>
          ))}
          {(project.required_skills?.length || 0) > 3 && (
            <Badge variant="outline" className="bg-muted/30">
              +{(project.required_skills?.length || 0) - 3} more
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
          {project.budget && (
            <div className="p-2 rounded-md bg-muted/30 flex items-center">
              <div className="flex-1">
                <p className="font-medium">₹{project.budget.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Budget</p>
              </div>
            </div>
          )}
          
          {project.deadline && (
            <div className="p-2 rounded-md bg-muted/30 flex items-center">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(project.deadline).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">Deadline</p>
              </div>
            </div>
          )}
        </div>
        
        {project.location && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <MapPinIcon className="h-3.5 w-3.5" />
            <span>{project.location}</span>
          </div>
        )}
        
        <div className="text-xs flex items-center gap-3 text-muted-foreground">
          <span>Applications: {applicationsCount}</span>
          <span>•</span>
          <span>Milestones: {milestonesCount}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          variant={hasApplied ? "outline" : "default"} 
          className={`w-full gap-2 ${hasApplied ? 'border-green-500 text-green-700' : ''}`}
          onClick={() => onApply(project)}
          disabled={hasApplied}
        >
          {hasApplied ? (
            <>
              <Check className="h-4 w-4" />
              Applied
            </>
          ) : (
            <>
              <BriefcaseIcon className="h-4 w-4" />
              Apply Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
