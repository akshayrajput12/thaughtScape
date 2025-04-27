
import React from 'react';
import { Project } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, CalendarIcon, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onProjectClick?: () => void;
}

export const ProjectCard = ({ project, onProjectClick }: ProjectCardProps) => {
  // Format the date
  const formattedDate = project.created_at 
    ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true })
    : 'recently';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={onProjectClick}>
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
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {project.budget && (
            <div className="p-2 rounded-md bg-muted/30">
              <p className="font-medium">₹{project.budget.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Budget</p>
            </div>
          )}
          
          {project.deadline && (
            <div className="p-2 rounded-md bg-muted/30 flex flex-col">
              <div className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Deadline</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button variant="default" className="w-full gap-2">
          <BriefcaseIcon className="h-4 w-4" />
          View Project
        </Button>
      </CardFooter>
    </Card>
  );
};
