import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Project } from "@/types";

export const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles(
            username,
            full_name,
            avatar_url
          ),
          freelancer:profiles(
            username,
            full_name,
            avatar_url
          ),
          applications_count:project_applications(count),
          milestones_count:project_applications(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithCounts = projectsData?.map(project => ({
        ...project,
        budget: project.min_budget,
        applications_count: project.applications_count || 0,
        milestones_count: project.milestones_count || 0
      })) as Project[];

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Could not fetch projects",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(project => project.id !== projectId));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Could not delete project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Button 
        onClick={fetchProjects}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Refresh Projects List
      </Button>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">
                  ₹{project.budget || project.min_budget}
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 text-purple-600">
                  {project.status}
                </Badge>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteProject(project.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                >
                  Delete Project
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
