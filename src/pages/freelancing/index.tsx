import { useState } from "react";
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
import type { Project, ProjectApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProjectApplicationCard } from "@/components/freelancing/ProjectApplicationCard";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { ApplicationDialog } from "./components/ApplicationDialog";
import { ProjectsList } from "./components/ProjectsList";

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, created_at, updated_at),
          applications:project_applications(count),
          comments:project_applications(count)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      return data.map(project => ({
        ...project,
        _count: {
          comments: project.comments?.[0]?.count || 0,
          applications: project.applications?.[0]?.count || 0
        }
      })) as Project[];
    },
  });

  const { data: userApplications = [], isLoading: isLoadingUserApplications } = useQuery({
    queryKey: ["userApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("project_id")
        .eq("applicant_id", user.id);
      if (error) throw error;
      return data.map(app => app.project_id);
    },
    enabled: !!user?.id,
  });

  const { data: receivedApplications = [], isLoading: isLoadingReceivedApplications } = useQuery({
    queryKey: ["receivedApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
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
          )
        `)
        .in(
          "project_id",
          projects?.filter((project) => project.author_id === user.id).map((project) => project.id) || []
        );
      
      // Mark applications as viewed
      if (data?.length) {
        await supabase
          .from("project_applications")
          .update({ viewed_at: new Date().toISOString() })
          .in("id", data.map(app => app.id))
          .is("viewed_at", null);
      }

      if (error) throw error;
      return data as ProjectApplication[];
    },
    enabled: !!user?.id,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Omit<Project, "id" | "created_at" | "updated_at" | "author">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert([newProject])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsNewProjectDialogOpen(false);
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

  const applyProjectMutation = useMutation({
    mutationFn: async ({ projectId, message }: { projectId: string; message: string }) => {
      const { data, error } = await supabase
        .from("project_applications")
        .insert([{
          project_id: projectId,
          applicant_id: user?.id,
          message,
          status: "pending" as const,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userApplications", user?.id] });
      setIsApplicationDialogOpen(false);
      setApplicationMessage("");
      toast({
        title: "Success",
        description: "Application submitted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit application: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: "accepted" | "rejected" }) => {
      const { data, error } = await supabase
        .from("project_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedApplications", user?.id] });
      toast({
        title: "Success",
        description: "Application status updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update application status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleApplyToProject = (project: Project) => {
    setSelectedProject(project);
    setIsApplicationDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:py-12">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="browse" className="space-y-8">
          <div className="sticky top-20 z-10 bg-white/80 backdrop-blur-md py-4 border-b border-gray-100">
            <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TabsTrigger value="browse" className="text-base sm:text-lg">Browse Projects</TabsTrigger>
              <TabsTrigger value="applied" className="text-base sm:text-lg">Applied Projects</TabsTrigger>
              <TabsTrigger value="received" className="text-base sm:text-lg">Received Applications</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="browse" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Available Projects
                </h2>
                <p className="mt-2 text-gray-600">Find your next opportunity</p>
              </div>
              <Button
                onClick={() => setIsNewProjectDialogOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Post New Project
              </Button>
            </div>

            <ProjectsList
              projects={projects}
              isLoading={isLoadingProjects}
              currentUserId={user?.id}
              userApplications={userApplications}
              onApply={handleApplyToProject}
            />
          </TabsContent>

          <TabsContent value="applied" className="space-y-6 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Applied Projects</h2>
            <ProjectsList
              projects={projects.filter((project) => userApplications.includes(project.id))}
              isLoading={isLoadingUserApplications}
              currentUserId={user?.id}
              userApplications={userApplications}
              onApply={handleApplyToProject}
            />
          </TabsContent>

          <TabsContent value="received" className="space-y-6 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Received Applications</h2>
            <div className="space-y-4">
              {receivedApplications.length === 0 ? (
                <p>No applications received yet.</p>
              ) : (
                receivedApplications.map((application) => (
                  <ProjectApplicationCard
                    key={application.id}
                    application={application}
                    onUpdateStatus={(applicationId, status) =>
                      updateApplicationStatusMutation.mutate({ applicationId, status })
                    }
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onSubmit={(newProject) => {
          createProjectMutation.mutate({
            ...newProject,
            author_id: user?.id as string,
          });
        }}
        isSubmitting={createProjectMutation.isPending}
      />

      <ApplicationDialog
        isOpen={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        project={selectedProject}
        message={applicationMessage}
        onMessageChange={setApplicationMessage}
        onSubmit={() => {
          if (selectedProject) {
            applyProjectMutation.mutate({
              projectId: selectedProject.id,
              message: applicationMessage,
            });
          }
        }}
        isSubmitting={applyProjectMutation.isPending}
      />
    </div>
  );
};

export default Freelancing;
