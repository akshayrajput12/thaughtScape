
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";

interface ProjectsListProps {
  projects: Project[];
  isLoading: boolean;
  currentUserId?: string;
  userApplications: string[];
  onApply: (project: Project) => void;
}

export const ProjectsList = ({
  projects,
  isLoading,
  currentUserId,
  userApplications,
  onApply,
}: ProjectsListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          currentUserId={currentUserId}
          hasApplied={userApplications.includes(project.id)}
          onApply={onApply}
        />
      ))}
    </div>
  );
};
