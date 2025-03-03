
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
  MessageSquare
} from "lucide-react";
import clsx from "clsx";
import type { Project, ProjectApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { ProjectApplicationCard } from "@/components/freelancing/ProjectApplicationCard";
import { useMobile } from "@/hooks/use-mobile";

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
      
      // First get projects authored by the user
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
      
      // Mark applications as viewed
      if (data?.length) {
        await supabase
          .from("project_applications")
          .update({ viewed_at: new Date().toISOString() })
          .in("id", data.map(app => app.id))
          .is("viewed_at", null);
      }

      if (error) throw error;
      return data as (ProjectApplication & { project: Project })[];
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

  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: Partial<Project> & { id: string }) => {
      const { id, ...projectData } = updatedProject;
      const { data, error } = await supabase
        .from("projects")
        .update(projectData)
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
    mutationFn: async ({ projectId, message, phoneNumber }: { projectId: string; message: string; phoneNumber: string }) => {
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
      // First update the application status
      const { data, error } = await supabase
        .from("project_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();
      
      if (error) throw error;
      
      // If status is accepted, update project status to in_progress
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
    // Find the application to get the project ID
    const application = receivedApplications.find(app => app.id === applicationId);
    if (application) {
      updateApplicationStatusMutation.mutate({
        applicationId,
        status,
        projectId: application.project?.id
      });
    }
  };

  // Effect to mark applications as viewed
  useEffect(() => {
    if (!user?.id) return;

    const markApplicationsAsViewed = async () => {
      // Get projects authored by the user
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("author_id", user.id);

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id);
        
        // Update viewed_at for unviewed applications
        await supabase
          .from("project_applications")
          .update({ viewed_at: new Date().toISOString() })
          .is("viewed_at", null)
          .in("project_id", projectIds);
      }
    };
    
    markApplicationsAsViewed();
  }, [user?.id]);

  // Check if user has already applied to a project
  const hasApplied = (projectId: string) => {
    return userApplications.some(app => app.project_id === projectId);
  };

  // Check application status
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
              <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Post a Project</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Post a New Project</DialogTitle>
                    <DialogDescription>
                      Provide details about the project you want to create.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const title = String(formData.get("title"));
                      const description = String(formData.get("description"));
                      const skills = String(formData.get("skills"))
                        .split(",")
                        .map((skill) => skill.trim());
                      const minBudget = Number(formData.get("min_budget"));
                      const maxBudget = Number(formData.get("max_budget"));
                      const whatsappNumber = String(formData.get("whatsapp_number") || "");
                      const deadline = String(formData.get("deadline"));

                      if (!user?.id) {
                        toast({
                          title: "Error",
                          description: "You must be logged in to create a project",
                          variant: "destructive",
                        });
                        return;
                      }

                      createProjectMutation.mutate({
                        title,
                        description,
                        required_skills: skills,
                        budget: minBudget,
                        deadline,
                        author_id: user.id,
                        status: "open",
                      });
                    }}
                    className="grid gap-4 py-4"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="title">Project Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        type="text"
                        placeholder="Enter a clear, descriptive title for your project" 
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Project Description</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Describe your project requirements, goals, and any specific instructions"
                        className="min-h-[150px]"
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="skills">Required Skills (comma-separated)</Label>
                      <Input 
                        id="skills" 
                        name="skills" 
                        type="text"
                        placeholder="e.g., React, Node.js, TypeScript" 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="min_budget">Minimum Budget (₹)</Label>
                        <Input 
                          id="min_budget" 
                          name="min_budget" 
                          type="number"
                          min="0"
                          placeholder="Enter minimum budget" 
                          required 
                        />
                      </div>
                      {/* <div className="grid gap-2">
                        <Label htmlFor="max_budget">Maximum Budget (₹)</Label>
                        <Input 
                          id="max_budget" 
                          name="max_budget" 
                          type="number"
                          min="0"
                          placeholder="Enter maximum budget" 
                          required 
                        />
                      </div> */}
                    </div>
                    {/* <div className="grid gap-2">
                      <Label htmlFor="whatsapp_number">WhatsApp Number (Optional)</Label>
                      <Input 
                        id="whatsapp_number" 
                        name="whatsapp_number" 
                        type="tel"
                        placeholder="Enter your WhatsApp number (e.g., +91XXXXXXXXXX)" 
                      />
                    </div> */}
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input 
                        id="deadline" 
                        name="deadline" 
                        type="date" 
                        required 
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={createProjectMutation.isPending}>
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
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
                    </div>

                    <div className="pt-4 flex flex-wrap gap-2 justify-end border-t border-gray-100">
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
                          <div className="flex gap-2">
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
                            {project.author?.whatsapp_number && (
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
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Applied Projects</h2>
            {isLoadingUserApplications || isLoadingProjects ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : userApplications.length === 0 ? (
              <div className="p-8 bg-white rounded-xl shadow-sm text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">You haven't applied to any projects yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleTabChange("browse")}
                >
                  Browse Projects
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects
                  ?.filter((project) => userApplications.some(app => app.project_id === project.id))
                  .map((project) => {
                    const appStatus = getApplicationStatus(project.id);
                    return (
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
                          <span className={clsx(
                            "px-3 py-1 rounded-full text-xs capitalize font-medium",
                            {
                              "bg-blue-100 text-blue-800": appStatus === "pending",
                              "bg-green-100 text-green-800": appStatus === "accepted",
                              "bg-red-100 text-red-800": appStatus === "rejected"
                            }
                          )}>
                            {appStatus || "Applied"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Received Applications</h2>
            {isLoadingReceivedApplications ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {receivedApplications.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl shadow-sm text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No applications received yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => handleTabChange("browse")}
                    >
                      Post a Project
                    </Button>
                  </div>
                ) : (
                  receivedApplications.map((application) => (
                    <ProjectApplicationCard
                      key={application.id}
                      application={application}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Project</DialogTitle>
            <DialogDescription>
              Share your details and explain why you're the best fit for this project.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedProject && user?.id) {
                const formData = new FormData(e.currentTarget);
                applyProjectMutation.mutate({
                  projectId: selectedProject.id,
                  message: String(formData.get("message")),
                  phoneNumber: String(formData.get("phone_number") || ""),
                });
              }
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="message">Cover Letter</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Explain why you're interested in this project and what makes you the best candidate"
                className="min-h-[150px]"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="Enter your contact number"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={applyProjectMutation.isPending}>
                {applyProjectMutation.isPending ? "Applying..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedProject) return;

              const formData = new FormData(e.currentTarget);
              const title = String(formData.get("title"));
              const description = String(formData.get("description"));
              const skills = String(formData.get("skills"))
                .split(",")
                .map((skill) => skill.trim());
              const budget = Number(formData.get("budget"));
              const deadline = String(formData.get("deadline"));
              const status = String(formData.get("status")) as any;

              updateProjectMutation.mutate({
                id: selectedProject.id,
                title,
                description,
                required_skills: skills,
                budget,
                deadline,
                status,
              });
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input 
                id="edit-title" 
                name="title" 
                defaultValue={selectedProject?.title}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Project Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                defaultValue={selectedProject?.description}
                className="min-h-[150px]"
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-skills">Required Skills (comma-separated)</Label>
              <Input 
                id="edit-skills" 
                name="skills" 
                defaultValue={selectedProject?.required_skills?.join(", ")}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-budget">Budget (₹)</Label>
              <Input 
                id="edit-budget" 
                name="budget" 
                type="number"
                defaultValue={selectedProject?.budget}
                min="0"
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input 
                id="edit-deadline" 
                name="deadline" 
                type="date" 
                defaultValue={selectedProject?.deadline?.split('T')[0]}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Project Status</Label>
              <select
                id="edit-status"
                name="status"
                defaultValue={selectedProject?.status}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={updateProjectMutation.isPending}>
                {updateProjectMutation.isPending ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your project 
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedProject) {
                  deleteProjectMutation.mutate(selectedProject.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Freelancing;
