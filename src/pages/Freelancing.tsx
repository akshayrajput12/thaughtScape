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
      
      // Transform project data to ensure it has the budget field for compatibility
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
      // First update the profile with WhatsApp number if provided
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
      
      // Update profile's WhatsApp number if provided
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

  const acceptApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("project_applications")
        .update({ status: "accepted" })
        .eq("id", applicationId);
      
      if (error) throw error;
      
      // Return a success message
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
      
      // Return a success message
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

  const handleAcceptApplication = (applicationId: string) => {
    acceptApplicationMutation.mutate(applicationId);
  };

  const handleRejectApplication = (applicationId: string) => {
    rejectApplicationMutation.mutate(applicationId);
  };

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
                      const whatsappNumber = String(formData.get("whatsapp_number") || "");
                      const deadline = String(formData.get("deadline"));
                      const allowWhatsappApply = formData.get("allow_whatsapp_apply") === "on";
                      const allowNormalApply = formData.get("allow_normal_apply") === "on";
                      const projectCategory = String(formData.get("project_category") || "");
                      const experienceLevel = String(formData.get("experience_level") || "");

                      if (!user?.id) {
                        toast({
                          title: "Error",
                          description: "You must be logged in to create a project",
                          variant: "destructive",
                        });
                        return;
                      }

                      if (!allowWhatsappApply && !allowNormalApply) {
                        toast({
                          title: "Error",
                          description: "You must allow at least one application method",
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
                        allow_whatsapp_apply: allowWhatsappApply,
                        allow_normal_apply: allowNormalApply,
                        whatsapp_number: whatsappNumber,
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project_category">Project Category</Label>
                        <select
                          id="project_category"
                          name="project_category"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          defaultValue=""
                        >
                          <option value="" disabled>Select category</option>
                          <option value="web_development">Web Development</option>
                          <option value="mobile_app">Mobile App Development</option>
                          <option value="design">Design</option>
                          <option value="writing">Content Writing</option>
                          <option value="marketing">Digital Marketing</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="experience_level">Required Experience Level</Label>
                        <select
                          id="experience_level"
                          name="experience_level"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          defaultValue=""
                        >
                          <option value="" disabled>Select level</option>
                          <option value="entry">Entry Level</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
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
                        <Label htmlFor="min_budget">Budget (₹)</Label>
                        <Input 
                          id="min_budget" 
                          name="min_budget" 
                          type="number"
                          min="0"
                          placeholder="Enter project budget" 
                          required 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input 
                          id="deadline" 
                          name="deadline" 
                          type="date" 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                      <Input 
                        id="whatsapp_number" 
                        name="whatsapp_number" 
                        type="tel"
                        placeholder="Enter your WhatsApp number (e.g., +919876543210)" 
                      />
                      <p className="text-xs text-gray-500">Format: Country code followed by number without spaces</p>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <Label>Application Methods</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="allow_normal_apply" 
                            name="allow_normal_apply" 
                            defaultChecked={true}
                            onCheckedChange={(checked) => {
                              setAllowNormalApply(checked as boolean);
                            }}
                          />
                          <label
                            htmlFor="allow_normal_apply"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Allow normal application through platform
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="allow_whatsapp_apply" 
                            name="allow_whatsapp_apply" 
                            defaultChecked={true}
                            onCheckedChange={(checked) => {
                              setAllowWhatsappApply(checked as boolean);
                            }}
                          />
                          <label
                            htmlFor="allow_whatsapp_apply"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Allow applications through WhatsApp
                          </label>
                        </div>
                      </div>
                      {!allowNormalApply && !allowWhatsappApply && (
                        <p className="text-xs text-red-500">At least one application method must be selected</p>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={createProjectMutation.isPending || (!allowNormalApply && !allowWhatsappApply)}>
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
          </
