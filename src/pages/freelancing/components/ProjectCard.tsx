
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ApplicationDialog } from "./ApplicationDialog";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onApply: (project: Project, message: string) => void;
  isSubmitting: boolean;
  hasApplied?: boolean;
}

export function ProjectCard({ project, onApply, isSubmitting, hasApplied }: ProjectCardProps) {
  const [message, setMessage] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const handleApply = () => {
    onApply(project, message);
    setIsOpen(false);
    setMessage("");
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold">{project.title}</h3>
              <Badge variant={project.status === "open" ? "default" : "secondary"}>
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground line-clamp-3">{project.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {project.required_skills?.map((skill, index) => (
              <Badge key={index} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {typeof project.applications_count === 'number' 
                  ? project.applications_count 
                  : Array.isArray(project.applications_count) 
                    ? project.applications_count.length 
                    : 0} applicants
              </span>
            </div>
            <div className="flex items-center col-span-2">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Budget: ₹{project.budget || project.min_budget}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 px-6 py-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={project.status !== "open" || hasApplied}
            >
              {hasApplied ? "Applied" : "Apply Now"}
            </Button>
          </DialogTrigger>
          <ApplicationDialog
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            project={project}
            message={message}
            onMessageChange={setMessage}
            onSubmit={handleApply}
            isSubmitting={isSubmitting}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
}
