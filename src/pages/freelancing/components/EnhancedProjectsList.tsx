
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Briefcase, Clock, Award } from "lucide-react";
import type { Project } from "@/types";

interface EnhancedProjectsListProps {
  projects: Project[];
  userApplications: string[];
  onApply: (project: Project) => void;
  isLoading: boolean;
}

export const EnhancedProjectsList = ({
  projects,
  userApplications,
  onApply,
  isLoading
}: EnhancedProjectsListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse">
            <Skeleton className="h-5 sm:h-6 w-2/3 mb-3 sm:mb-4" />
            <Skeleton className="h-3 sm:h-4 w-full mb-2" />
            <Skeleton className="h-3 sm:h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-xl font-semibold mb-2">No projects available</h3>
        <p className="text-muted-foreground text-center max-w-md">
          There are no open projects available at the moment. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 border dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
                {project.title}
              </h3>
              {project.is_featured && (
                <Badge variant="default" className="bg-amber-400 hover:bg-amber-500 text-amber-900">
                  Featured
                </Badge>
              )}
            </div>
            
            <div className="space-y-3 mb-4">
              {project.company_name && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{project.company_name}</span>
                </div>
              )}
              
              {project.location && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{project.location}</span>
                </div>
              )}
              
              {project.job_type && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{project.job_type}</span>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {project.experience_level && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Award className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{project.experience_level}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm font-medium">
                ₹{project.min_budget}{project.max_budget ? ` - ₹${project.max_budget}` : '+'}
              </div>
              <Button 
                onClick={() => onApply(project)}
                variant={userApplications.includes(project.id) ? "secondary" : "default"}
                className={userApplications.includes(project.id) ? 
                  "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" : 
                  "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600"
                }
                size="sm"
              >
                {userApplications.includes(project.id) ? "Applied" : "Apply Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
