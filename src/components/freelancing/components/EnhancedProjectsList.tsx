
import React from 'react';
import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { ProjectCard } from './ProjectCard';

interface EnhancedProjectsListProps {
  projects: Project[];
  isLoading?: boolean;
  showApplyButton?: boolean;
  onProjectClick?: (id: string) => void;
}

export const EnhancedProjectsList = ({
  projects,
  isLoading = false,
  showApplyButton = false,
  onProjectClick
}: EnhancedProjectsListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 bg-background rounded-xl shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-md mt-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <div className="bg-background p-8 rounded-xl shadow-sm text-center">
          <div className="mx-auto mb-4 bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            We couldn't find any projects matching your search criteria. Try adjusting your filters or check back later.
          </p>
          <Button variant="outline" className="mt-2">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onProjectClick={onProjectClick ? () => onProjectClick(project.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
