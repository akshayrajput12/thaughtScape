import React, { useState } from 'react';
import { Project } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  project: Project;
  onProjectClick?: () => void;
  hasApplied?: boolean;
  onApply?: (project: Project) => void;
}

export const ProjectCard = ({ project, onProjectClick, hasApplied = false, onApply }: ProjectCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const formattedDate = project.created_at 
    ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true })
    : 'recently';

  const handleWhatsAppApply = () => {
    if (!project.author?.whatsapp_number) return;

    const message = encodeURIComponent(
      `Hi, I'm interested in your project "${project.title}". I found it on the platform.`
    );

    window.open(
      `https://wa.me/${project.author.whatsapp_number}?text=${message}`,
      '_blank'
    );
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={() => setShowDetails(true)}>
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
          <div className="flex gap-2 w-full">
            {project.status === "open" && !hasApplied && (
              <>
                {project.allow_normal_apply !== false && onApply && (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => onApply(project)}
                  >
                    <BriefcaseIcon className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                )}
                
                {project.allow_whatsapp_apply !== false && project.author?.whatsapp_number && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleWhatsAppApply}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Apply via WhatsApp
                  </Button>
                )}
              </>
            )}
            {hasApplied && (
              <Button variant="outline" className="w-full" disabled>
                Applied
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{project.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={project.author?.avatar_url} alt={project.author?.username} />
                <AvatarFallback>
                  {project.author?.username?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{project.author?.username}</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-muted-foreground">{project.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {project.budget && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="font-medium">₹{project.budget.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Budget</p>
                </div>
              )}
              
              {project.deadline && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(project.deadline).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                </div>
              )}
            </div>

            {project.required_skills && project.required_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill, index) => (
                    <Badge key={index} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              {project.status === "open" && !hasApplied && (
                <>
                  {project.allow_normal_apply !== false && onApply && (
                    <Button className="flex-1" onClick={() => onApply(project)}>
                      Apply Now
                    </Button>
                  )}
                  
                  {project.allow_whatsapp_apply !== false && project.author?.whatsapp_number && (
                    <Button variant="outline" onClick={handleWhatsAppApply} className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Apply via WhatsApp
                    </Button>
                  )}
                </>
              )}
              {hasApplied && (
                <Button variant="outline" className="flex-1" disabled>
                  Applied
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
