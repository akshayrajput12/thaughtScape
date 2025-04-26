import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IndianRupee,
  User,
  CheckCircle2,
  Calendar,
  Menu,
  ChevronRight,
  Pencil,
  Trash,
  AlertCircle,
  MessageSquare,
  Phone,
  Briefcase,
  CheckCircle,
  Clock,
  Flag,
  PlusCircle,
  Search,
  Filter,
  ExternalLink
} from "lucide-react";
import clsx from "clsx";
import type { Project, ProjectApplication, UserApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { ProjectApplicationCard } from "@/components/freelancing/ProjectApplicationCard";
import { useMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { NewProjectDialog } from "@/pages/freelancing/components/NewProjectDialog";
import { ApplicationDialog } from "@/pages/freelancing/components/ApplicationDialog";
import { EnhancedProjectCard } from "@/pages/freelancing/components/EnhancedProjectCard";
import { EnhancedProjectsList } from "@/pages/freelancing/components/EnhancedProjectsList";
import { EnhancedApplicationDialog } from "@/pages/freelancing/components/EnhancedApplicationDialog";
import { FreelanceHeader } from "@/pages/freelancing/components/FreelanceHeader";
import { motion } from "framer-motion";

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [allowNormalApply, setAllowNormalApply] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
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
      return data as UserApplication[];
    },
    enabled: !!user?.id,
  });

  const { data: receivedApplications = [], isLoading: isLoadingReceivedApplications } = useQuery({
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

      if (data?.length) {
        await supabase
          .from("project_applications")
          .update({ viewed_at: new Date().toISOString() })
          .in("id", data.map(app => app.id))
          .is("viewed_at", null);
      }

      if (error) throw error;

      return data.map(app => ({
        ...app,
        status: app.status as "pending" | "accepted" | "rejected",
        project: {
          ...app.project,
          budget: app.project.min_budget,
          status: app.project.status as "open" | "closed" | "in_progress"
        }
      })) as (ProjectApplication & { project: Project })[];
    },
    enabled: !!user?.id,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Omit<Project, "id" | "created_at" | "updated_at" | "author_id" | "status"> & {
      allow_whatsapp_apply?: boolean,
      allow_normal_apply?: boolean,
      whatsapp_number?: string
    }) => {
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
          author_id: user.id,
          status: "open",
          allow_whatsapp_apply: newProject.allow_whatsapp_apply,
          allow_normal_apply: newProject.allow_normal_apply
        }])
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();
      if (error) throw error;
      return data as Project;
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

  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: Partial<Project> & { id: string, allow_whatsapp_apply?: boolean, allow_normal_apply?: boolean, whatsapp_number?: string }) => {
      const { id, budget, whatsapp_number, ...projectData } = updatedProject;

      if (whatsapp_number && user?.id) {
        await supabase
          .from("profiles")
          .update({ whatsapp_number: whatsapp_number })
          .eq("id", user.id);
      }

      const { data, error } = await supabase
        .from("projects")
        .update({
          ...projectData,
          min_budget: budget,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditProjectDialogOpen(false);
      toast({
        title: "Success",
        description: "Project updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDeleteAlertOpen(false);
      setSelectedProject(null);
      toast({
        title: "Success",
        description: "Project deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const applyProjectMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      message, 
      phoneNumber, 
      experience, 
      portfolio 
    }: { 
      projectId: string; 
      message: string; 
      phoneNumber: string;
      experience?: string;
      portfolio?: string; 
    }) => {
      const { data, error } = await supabase
        .from("project_applications")
        .insert([{
          project_id: projectId,
          applicant_id: user?.id,
          message,
          phone_number: phoneNumber,
          experience,
          portfolio,
          status: "pending" as const,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userApplications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
    mutationFn: async ({ applicationId, status, projectId }: { applicationId: string; status: "accepted" | "rejected"; projectId?: string }) => {
      const { data, error } = await supabase
        .from("project_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();

      if (error) throw error;

      if (status === "accepted" && projectId) {
        const { error: projectError } = await supabase
          .from("projects")
          .update({ status: "in_progress" })
          .eq("id", projectId);

        if (projectError) throw projectError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedApplications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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

  const acceptApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("project_applications")
        .update({ status: "accepted" })
        .eq("id", applicationId);

      if (error) throw error;

      return { success: true, message: "Application accepted successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application accepted successfully",
      });
    },
    onError: (error) => {
      console.error('Error accepting application:', error);
      toast({
        title: "Error",
        description: "Failed to accept application",
        variant: "destructive",
      });
    }
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("project_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId);

      if (error) throw error;

      return { success: true, message: "Application rejected successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application rejected successfully",
      });
    },
    onError: (error) => {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    }
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditProjectDialogOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteAlertOpen(true);
  };

  const handleUpdateStatus = (applicationId: string, status: "accepted" | "rejected") => {
    const application = receivedApplications.find(app => app.id === applicationId);
    if (application) {
      updateApplicationStatusMutation.mutate({
        applicationId,
        status,
        projectId: application.project?.id
      });
    }
  };

  const handleAcceptApplication = (applicationId: string) => {
    acceptApplicationMutation.mutate(applicationId);
  };

  const handleRejectApplication = (applicationId: string) => {
    rejectApplicationMutation.mutate(applicationId);
  };

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

  const handleApplyToProject = () => {
    if (!selectedProject) return;
    
    applyProjectMutation.mutate({
      projectId: selectedProject.id,
      message: applicationMessage,
      phoneNumber: phoneNumber,
      experience: experience,
      portfolio: portfolio,
    });
  };

  const handleExternalApply = () => {
    if (!selectedProject || !selectedProject.application_link) return;
    window.open(selectedProject.application_link, '_blank');
  };

  const handleProjectCreated = (project: Project) => {
    toast({
      title: "Success",
      description: "Project created successfully!",
    });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  useEffect(() => {
    if (!user?.id) return;

    const markApplicationsAsViewed = async () => {
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("author_id", user.id);

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id);

        await supabase
          .from("project_applications")
          .update({ viewed_at: new Date().toISOString() })
          .is("viewed_at", null)
          .in("project_id", projectIds);
      }
    };

    markApplicationsAsViewed();
  }, [user?.id]);

  const hasApplied = (projectId: string) => {
    return userApplications.some(app => app.project_id === projectId);
  };

  const getApplicationStatus = (projectId: string) => {
    const application = userApplications.find(app => app.project_id === projectId);
    return application?.status || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">CampusCash Jobs</h1>
          {isMobile && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-6">
                  <Button
                    variant={activeTab === "browse" ? "default" : "ghost"}
                    className="justify-start gap-2"
                    onClick={() => handleTabChange("browse")}
                  >
                    <ChevronRight className="h-4 w-4" />
                    Browse Projects
                  </Button>
                  <Button
                    variant={activeTab === "applied" ? "default" : "ghost"}
                    className="justify-start gap-2"
                    onClick={() => handleTabChange("applied")}
                  >
                    <ChevronRight className="h-4 w-4" />
                    Applied Projects
                  </Button>
                  <Button
                    variant={activeTab === "received" ? "default" : "ghost"}
                    className="justify-start gap-2"
                    onClick={() => handleTabChange("received")}
                  >
                    <ChevronRight className="h-4 w-4" />
                    Received Applications
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          {!isMobile && (
            <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3 gap-4">
              <TabsTrigger value="browse" className="text-lg">Browse Projects</TabsTrigger>
              <TabsTrigger value="applied" className="text-lg">Applied Projects</TabsTrigger>
              <TabsTrigger value="received" className="text-lg">Received Applications</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="browse" className="space-y-6">
            <FreelanceHeader
              onPostJob={() => setIsNewProjectModalOpen(true)}
              jobCount={projects.filter(p => p.status === "open").length}
            />

            {isLoadingProjects ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-card rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : (
              <EnhancedProjectsList
                projects={projects}
                userApplications={userApplications.map(app => app.project_id)}
                onApply={(project) => {
                  setSelectedProject(project);
                  setApplicationMessage("");
                  setPhoneNumber("");
                  setExperience("");
                  setPortfolio("");
                  setIsApplicationDialogOpen(true);
                }}
                isLoading={isLoadingProjects}
              />
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <motion.h2
              className="text-3xl font-bold text-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Your Applications
            </motion.h2>

            {isLoadingUserApplications ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-card rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {projects
                  .filter((project) => hasApplied(project.id))
                  .length === 0 ? (
                  <motion.div
                    className="text-center py-16 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-lg opacity-50"></div>
                        <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-8 w-8 text-primary/70" />
                        </div>
                      </div>

                      <h3 className="text-xl font-medium text-foreground mb-2">No Applications Yet</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        You haven't applied to any jobs yet. Browse available jobs and submit your first application.
                      </p>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setActiveTab("browse")}
                        className="gap-2 bg-gradient-to-r from-background to-background/80 hover:from-background/80 hover:to-background border-primary/20"
                      >
                        <Search className="h-4 w-4" />
                        Browse Jobs
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects
                      .filter((project) => hasApplied(project.id))
                      .map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <EnhancedProjectCard
                            project={project}
                            hasApplied={true}
                            onApply={() => {}}
                          />
                        </motion.div>
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <motion.h2
              className="text-3xl font-bold text-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Received Applications
            </motion.h2>

            {isLoadingReceivedApplications ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 bg-card rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-10 w-10 rounded-full mb-4" />
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {receivedApplications.length === 0 ? (
                  <motion.div
                    className="text-center py-16 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-lg opacity-50"></div>
                        <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-8 w-8 text-primary/70" />
                        </div>
                      </div>

                      <h3 className="text-xl font-medium text-foreground mb-2">No Applications Yet</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        You haven't received any applications for your jobs yet. Post a new job to attract applicants.
                      </p>

                      <Button
                        onClick={() => setIsNewProjectModalOpen(true)}
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Post a New Job
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {receivedApplications.map((application, index) => (
                      <motion.div
                        key={application.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ProjectApplicationCard
                          application={application}
                          onUpdateStatus={handleUpdateStatus}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the details of your project.
              </DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <ScrollArea className="max-h-[70vh]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const title = String(formData.get("title"));
                    const description = String(formData.get("description"));
                    const skills = String(formData.get("skills"))
                      .split(",")
                      .map((skill) => skill.trim());
                    const budget = Number(formData.get("budget"));
                    const deadline = String(formData.get("deadline"));
                    const whatsappNumber = String(formData.get("whatsapp_number") || "");
                    const allowWhatsapp = !!formData.get("allow_whatsapp_apply");
                    const allowNormal = !!formData.get("allow_normal_apply");

                    updateProjectMutation.mutate({
                      id: selectedProject.id,
                      title,
                      description,
                      required_skills: skills,
                      budget,
                      deadline: deadline || undefined,
                      whatsapp_number: whatsappNumber,
                      allow_whatsapp_apply: allowWhatsapp,
                      allow_normal_apply: allowNormal
                    });
                  }}
                  className="space-y-6 p-2"
                >
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={selectedProject?.title} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={selectedProject?.description} required />
                  </div>
                  <div>
                    <Label htmlFor="skills">Required Skills</Label>
                    <Input id="skills" name="skills" defaultValue={selectedProject?.required_skills?.join(",")} required />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget</Label>
                    <Input id="budget" name="budget" type="number" defaultValue={selectedProject?.budget} required />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input id="deadline" name="deadline" type="date" defaultValue={selectedProject?.deadline} required />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input id="whatsapp_number" name="whatsapp_number" defaultValue={selectedProject?.author?.whatsapp_number} />
                  </div>
                  <div>
                    <Checkbox
                      id="allow_whatsapp_apply"
                      name="allow_whatsapp_apply"
                      checked={allowWhatsappApply}
                      onCheckedChange={(checked) => setAllowWhatsappApply(checked === true)}
                    />
                    <Label htmlFor="allow_whatsapp_apply">Allow WhatsApp Apply</Label>
                  </div>
                  <div>
                    <Checkbox
                      id="allow_normal_apply"
                      name="allow_normal_apply"
                      checked={allowNormalApply}
                      onCheckedChange={(checked) => setAllowNormalApply(checked === true)}
                    />
                    <Label htmlFor="allow_normal_apply">Allow Normal Apply</Label>
                  </div>
                </form>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteProjectMutation.mutate(selectedProject?.id);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <NewProjectDialog
          isOpen={isNewProjectModalOpen}
          onOpenChange={setIsNewProjectModalOpen}
          onProjectCreated={handleProjectCreated}
          onSubmit={handleCreateProject}
          isSubmitting={createProjectMutation.isPending}
        />

        {selectedProject && (
          <EnhancedApplicationDialog
            isOpen={isApplicationDialogOpen}
            onOpenChange={setIsApplicationDialogOpen}
            project={selectedProject}
            message={applicationMessage}
            onMessageChange={setApplicationMessage}
            onSubmit={handleApplyToProject}
            isSubmitting={applyProjectMutation.isPending}
            onExternalApply={handleExternalApply}
          />
        )}
      </div>
    </div>
  );
};

export default Freelancing;
