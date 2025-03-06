
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProjectsList } from "./components/ProjectsList";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Project, ProjectApplication } from "@/types";

const Freelancing = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userApplications, setUserApplications] = useState<ProjectApplication[]>([]);
  
  useEffect(() => {
    fetchProjects();
    if (user?.id) {
      fetchUserApplications();
    }
  }, [user?.id]);
  
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          _count { applications }
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Type assertion for the project status
      const typedProjects = data.map(proj => ({
        ...proj,
        status: proj.status as "open" | "closed" | "in_progress"
      }));
      
      setProjects(typedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserApplications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('project_applications')
        .select('*')
        .eq('applicant_id', user.id);
        
      if (error) throw error;
      
      setUserApplications(data);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };
  
  const handleSubmitProject = async (projectData: any) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a project',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...projectData,
            author_id: user.id,
          },
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success!',
        description: 'Your project has been created',
      });
      
      // Type assertion for the project status
      const typedProject = {
        ...data,
        status: data.status as "open" | "closed" | "in_progress"
      };
      
      setProjects([typedProject, ...projects]);
      setIsNewProjectDialogOpen(false);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleApply = async (projectId: string, application: any) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to apply',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('project_applications')
        .insert([
          {
            ...application,
            project_id: projectId,
            applicant_id: user.id,
          },
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: 'Application Submitted!',
        description: 'Your application has been sent to the project owner',
      });
      
      setUserApplications([...userApplications, data[0]]);
      
    } catch (error) {
      console.error('Error applying to project:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };
  
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Freelancing Projects</h1>
          <p className="text-gray-600">Browse and apply to projects or create your own</p>
        </div>
        
        <Button onClick={() => setIsNewProjectDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" /> Create Project
        </Button>
      </div>
      
      <ProjectsList 
        projects={projects} 
        isLoading={isLoading} 
        userApplications={userApplications}
        onApply={handleApply}
      />
      
      <NewProjectDialog 
        isOpen={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onSubmit={handleSubmitProject}
        isSubmitting={isSubmitting}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Freelancing;
