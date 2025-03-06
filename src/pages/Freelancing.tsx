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
  Flag
} from "lucide-react";
import clsx from "clsx";
import type { Project, ProjectApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { ProjectApplicationCard } from "@/components/freelancing/ProjectApplicationCard";
import { useMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { NewProjectDialog } from "@/pages/freelancing/components/NewProjectDialog";
import { ApplicationDialog } from "@/pages/freelancing/components/ApplicationDialog";

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMobile();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [allowNormalApply, setAllowNormalApply] = useState(true);

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
        .select("project_id, status")
        .eq("applicant_id", user.id);
      if (error) throw error;
      return data;
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
        project: {
          ...app.project,
          budget: app.project.min_budget
        }
      })) as (ProjectApplication & { project: Project })[];
    },
    enabled: !!user?.id,
  });

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
      phoneNumber: "",
      experience: "",
      portfolio: "",
    });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Freelancing Hub</h1>
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
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-gray-900">Available Projects</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsNewProjectDialogOpen(true)}>Post a Project</Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {isLoadingProjects ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                          {project.title}
                        </h3>
                        {user?.id === project.author_id && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditProject(project)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500"
                              onClick={() => handleDeleteProject(project)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <IndianRupee className="w-4 h-4" />
                        <span className="text-sm">Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm">{project.author?.full_name || project.author?.username}</span>
                      </div>
                      
                      {project.required_skills && project.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {project.required_skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex flex-wrap gap-2 border-t border-gray-100">
                      <div className="w-full flex flex-wrap justify-between items-center">
                        <span className={clsx(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          {
                            "bg-green-100 text-green-800": project.status === "open",
                            "bg-yellow-100 text-yellow-800": project.status === "in_progress",
                            "bg-gray-100 text-gray-800": project.status === "closed"
                          }
                        )}>
                          {project.status?.toUpperCase()}
                        </span>
                        
                        {project.status === "in_progress" && hasApplied(project.id) && getApplicationStatus(project.id) === "accepted" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Awarded
                          </Button>
                        ) : (
                          project.status === "open" && project.author_id !== user?.id && !hasApplied(project.id) ? (
                            <div className="flex flex-wrap gap-2">
                              {project.allow_normal_apply !== false && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setIsApplicationDialogOpen(true);
                                  }}
                                >
                                  Apply Now
                                </Button>
                              )}
                              
                              {project.author?.whatsapp_number && project.allow_whatsapp_apply !== false && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const message = encodeURIComponent(
                                      `Hi, I'm interested in your project "${project.title}". I found it on the freelancing platform.`
                                    );
                                    window.open(
                                      `https://wa.me/${project.author.whatsapp_number}?text=${message}`,
                                      '_blank'
                                    );
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Apply via WhatsApp
                                </Button>
                              )}
                            </div>
                          ) : (
                            hasApplied(project.id) && (
                              <span className={clsx(
                                "px-3 py-1 rounded-full text-xs capitalize font-medium",
                                {
                                  "bg-blue-100 text-blue-800": getApplicationStatus(project.id) === "pending",
                                  "bg-green-100 text-green-800": getApplicationStatus(project.id) === "accepted",
                                  "bg-red-100 text-red-800": getApplicationStatus(project.id) === "rejected"
                                }
                              )}>
                                {getApplicationStatus(project.id) || "Applied"}
                              </span>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Applied Projects</h2>
            {isLoadingUserApplications ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
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
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-500">You haven't applied to any projects yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects
                      .filter((project) => hasApplied(project.id))
                      .map((project) => (
                        <div
                          key={project.id}
                          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100"
                        >
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                              {project.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {project.description}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-600">
                              <IndianRupee className="w-4 h-4" />
                              <span className="text-sm">Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4" />
                              <span className="text-sm">{project.author?.full_name || project.author?.username}</span>
                            </div>
                          </div>

                          <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                            <span
                              className={clsx(
                                "px-3 py-1 rounded-full text-xs capitalize font-medium",
                                {
                                  "bg-blue-100 text-blue-800": getApplicationStatus(project.id) === "pending",
                                  "bg-green-100 text-green-800": getApplicationStatus(project.id) === "accepted",
                                  "bg-red-100 text-red-800": getApplicationStatus(project.id) === "rejected"
                                }
                              )}
                            >
                              {getApplicationStatus(project.id) || "Applied"}
                            </span>

                            <span className={clsx(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              {
                                "bg-green-100 text-green-800": project.status === "open",
                                "bg-yellow-100 text-yellow-800": project.status === "in_progress",
                                "bg-gray-100 text-gray-800": project.status === "closed"
                              }
                            )}>
                              {project.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Received Applications</h2>
            
            {isLoadingReceivedApplications ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
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
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-500">You haven't received any applications yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {receivedApplications.map((application) => (
                      <ProjectApplicationCard
                        key={application.id}
                        application={application}
                        onUpdateStatus={handleUpdateStatus}
                      />
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
                    const allowWhatsappApply = formData.get("allow_whatsapp_apply") === "on";
                    const allowNormalApply = formData.get("allow_normal_apply") === "on";

                    if (!allowWhatsappApply && !allowNormalApply) {
                      toast({
                        title: "Error",
                        description: "You must allow at least one application method",
                        variant: "destructive",
                      });
                      return;
                    }

                    updateProjectMutation.mutate({
                      id: selectedProject.id,
                      title,
                      description,
                      required_skills: skills,
                      budget,
                      deadline,
                      allow_whatsapp_apply: allowWhatsappApply,
                      allow_normal_apply: allowNormalApply,
                      whatsapp_number: whatsappNumber,
                    });
                  }}
                  className="space-y-6 p-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={selectedProject.title}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={5}
                      defaultValue={selectedProject.description}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skills">Required Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      name="skills"
                      defaultValue={selectedProject.required_skills?.join(", ") || ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (in ₹)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      defaultValue={selectedProject.budget}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      defaultValue={selectedProject.deadline?.split("T")[0] || ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">WhatsApp Number (optional)</Label>
                    <Input
                      id="whatsapp_number"
                      name="whatsapp_number"
                      type="tel"
                      placeholder="e.g. 919876543210 (with country code)"
                      defaultValue={selectedProject.author?.whatsapp_number || ""}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Application Settings</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="allow_normal_apply" 
                          name="allow_normal_apply"
                          defaultChecked={selectedProject.allow_normal_apply !== false}
                        />
                        <label
                          htmlFor="allow_normal_apply"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Allow normal applications
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="allow_whatsapp_apply" 
                          name="allow_whatsapp_apply"
                          defaultChecked={selectedProject.allow_whatsapp_apply !== false}
                        />
                        <label
                          htmlFor="allow_whatsapp_apply"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Allow WhatsApp applications
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={updateProjectMutation.isPending}>
                      {updateProjectMutation.isPending ? "Updating..." : "Update Project"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        <NewProjectDialog 
          isOpen={isNewProjectDialogOpen}
          onOpenChange={setIsNewProjectDialogOpen}
          onSubmit={handleCreateProject}
          isSubmitting={createProjectMutation.isPending}
          onProjectCreated={(project) => {
            queryClient.setQueryData(["projects"], (oldData: Project[] | undefined) => 
              oldData ? [project, ...oldData] : [project]
            );
          }}
        />

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the project. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedProject && deleteProjectMutation.mutate(selectedProject.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ApplicationDialog
          isOpen={isApplicationDialogOpen}
          onOpenChange={setIsApplicationDialogOpen}
          project={selectedProject}
          message={applicationMessage}
          onMessageChange={setApplicationMessage}
          onSubmit={handleApplyToProject}
          isSubmitting={applyProjectMutation.isPending}
        />
      </div>
    </div>
  );
};

export default Freelancing;
