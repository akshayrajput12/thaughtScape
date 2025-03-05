
import React from 'react';
import { Project } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectCard } from './ProjectCard';

export interface ProjectsListProps {
  projects: Project[];
  isLoading: boolean;
  userApplications: string[];
  onApply: (project: Project) => void;
}

export const ProjectsList = ({ 
  projects, 
  isLoading, 
  userApplications, 
  onApply 
}: ProjectsListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
            <Skeleton className="h-6 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <p className="text-gray-500">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          hasApplied={userApplications.includes(project.id)}
          onApply={onApply}
        />
      ))}
    </div>
  );
};
