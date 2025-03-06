
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import type { Project, ProjectApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { NewProjectDialog } from "@/pages/freelancing/components/NewProjectDialog";
import { ProjectsList } from "@/pages/freelancing/components/ProjectsList";

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch all projects
  const { data: projectsData = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, created_at, updated_at, whatsapp_number),
          applications:project_applications(count),
          comments:project_applications(count)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      return data.map(project => ({
        ...project,
        budget: project.min_budget,
        _count: {
          comments: project.comments?.[0]?.count || 0,
          applications: project.applications?.[0]?.count || 0
        },
        status: project.status as "open" | "closed" | "in_progress"
      })) as Project[];
    },
  });

  const { data: userApplications = [], isLoading: isLoadingUserApplications } = useQuery({
    queryKey: ["userApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("project_id, status")
        .eq("applicant_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: receivedApplicationsData = [], isLoading: isLoadingReceivedApplications } = useQuery({
    queryKey: ["receivedApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("author_id", user.id);
      
      if (!userProjects || userProjects.length === 0) return [];
      
      const projectIds = userProjects.map(project => project.id);
      
      const { data, error } = await supabase
        .from("project_applications")
        .select(`
          *,
          applicant:profiles(
            id,
            username,
            full_name,
            avatar_url,
            created_at,
            updated_at
          ),
          project:projects(
            *
          )
        `)
        .in("project_id", projectIds);
      
      if (error) throw error;

      return data;
    },
    enabled: !!user?.id,
  });

  // Cast the received applications to the correct type
  const receivedApplications = receivedApplicationsData.map(app => ({
    ...app,
    status: app.status as "pending" | "accepted" | "rejected",
    project: app.project && {
      ...app.project,
      budget: app.project.min_budget,
      status: app.project.status as "open" | "closed" | "in_progress"
    }
  })) as ProjectApplication[];

  // Update viewed timestamps when loading applications
  useEffect(() => {
    const updateViewedTimestamps = async () => {
      if (!user?.id || receivedApplications.length === 0) return;
      
      // Get applications that need to be marked as viewed
      const unviewedApplicationIds = receivedApplications
        .filter(app => !app.viewed_at)
        .map(app => app.id);
      
      if (unviewedApplicationIds.length > 0) {
        await supabase
          .from("project_applications")
          .update({ viewed_at: new Date().toISOString() })
          .in("id", unviewedApplicationIds);
      }
    };
    
    updateViewedTimestamps();
  }, [receivedApplications, user?.id]);

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Omit<Project, "id" | "created_at" | "updated_at" | "author"> & { allow_whatsapp_apply?: boolean, allow_normal_apply?: boolean, whatsapp_number?: string }) => {
      if (newProject.whatsapp_number && user?.id) {
        await supabase
          .from("profiles")
          .update({ whatsapp_number: newProject.whatsapp_number })
          .eq("id", user.id);
      }
      
      const { data, error } = await supabase
        .from("projects")
        .insert([{
          title: newProject.title,
          description: newProject.description,
          required_skills: newProject.required_skills,
          min_budget: newProject.budget,
          deadline: newProject.deadline,
          author_id: newProject.author_id,
          status: newProject.status,
          allow_whatsapp_apply: newProject.allow_whatsapp_apply,
          allow_normal_apply: newProject.allow_normal_apply
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsNewProjectModalOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (newProject: any) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      ...newProject,
      author_id: user.id,
      status: "open",
    });
  };

  const handleProjectCreated = (project: Project) => {
    toast({
      title: "Success",
      description: "Project created successfully!",
    });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleApplyToProject = (projectId: string, application: any) => {
    // Project application handling logic
  };

  const hasApplied = (projectId: string) => {
    return userApplications.some(app => app.project_id === projectId);
  };

  const getApplicationStatus = (projectId: string) => {
    const application = userApplications.find(app => app.project_id === projectId);
    return application?.status || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Freelancing Hub</h1>
          {/* Mobile menu button would go here */}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3 gap-4">
            <TabsTrigger value="browse" className="text-lg">Browse Projects</TabsTrigger>
            <TabsTrigger value="applied" className="text-lg">Applied Projects</TabsTrigger>
            <TabsTrigger value="received" className="text-lg">Received Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-gray-900">Available Projects</h2>
              <Dialog>
                <NewProjectDialog 
                  isOpen={isNewProjectModalOpen}
                  onOpenChange={setIsNewProjectModalOpen}
                  onSubmit={handleCreateProject}
                  isSubmitting={createProjectMutation.isPending}
                  onProjectCreated={handleProjectCreated}
                />
                
                <Button onClick={() => setIsNewProjectModalOpen(true)}>
                  Post a Project
                </Button>
              </Dialog>
            </div>

            <ProjectsList 
              projects={projectsData}
              isLoading={isLoadingProjects}
              userApplications={userApplications}
              onApply={handleApplyToProject}
            />
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Applied Projects</h2>
            {/* Applied projects content would go here */}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Received Applications</h2>
            {/* Received applications content would go here */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Freelancing;
