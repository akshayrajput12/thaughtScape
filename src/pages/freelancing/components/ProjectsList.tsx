
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";

interface ProjectsListProps {
  projects: Project[];
  isLoading: boolean;
  userApplications: string[];
  onApply: (project: Project, message: string) => void;
  isSubmitting?: boolean;
}

export const ProjectsList = ({
  projects,
  isLoading,
  userApplications,
  onApply,
  isSubmitting = false,
}: ProjectsListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 sm:p-6 bg-white rounded-xl shadow-sm animate-pulse">
            <Skeleton className="h-5 sm:h-6 w-2/3 mb-3" />
            <Skeleton className="h-3 sm:h-4 w-full mb-2" />
            <Skeleton className="h-3 sm:h-4 w-5/6 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-4/6" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          hasApplied={userApplications.includes(project.id)}
          onApply={onApply}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
};
