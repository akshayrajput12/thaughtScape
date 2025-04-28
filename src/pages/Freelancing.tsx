
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom"; // Add this import for navigation
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
  Menu,
  ChevronRight,
  Briefcase,
  FileText,
  MessageSquare,
  Search,
  X,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";
import type { Project, ProjectApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProjectApplicationCard } from "@/components/freelancing/ProjectApplicationCard";
import { useMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobListItem from "./freelancing/components/JobListItem";
import { NewProjectDialog } from "@/pages/freelancing/components/NewProjectDialog";
import { ApplicationDialog } from "@/pages/freelancing/components/ApplicationDialog";


export const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Initialize the navigate function
  const isMobile = useMobile();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"newest" | "budget-high" | "budget-low" | "deadline">("newest");

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
        // Keep both min_budget and max_budget for proper budget display
        min_budget: project.min_budget,
        max_budget: project.max_budget,
        // For backward compatibility
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
      return data as { project_id: string; status: "pending" | "accepted" | "rejected" }[];
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
          // Keep both min_budget and max_budget for proper budget display
          min_budget: app.project.min_budget,
          max_budget: app.project.max_budget,
          // For backward compatibility
          budget: app.project.min_budget,
          status: app.project.status as "open" | "closed" | "in_progress"
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

      let skillsArray: string[] = [];

      if (Array.isArray(newProject.required_skills)) {
        skillsArray = newProject.required_skills;
      } else if (typeof newProject.required_skills === 'string') {
        const skillsText = newProject.required_skills as string;
        if (skillsText.trim() !== '') {
          skillsArray = skillsText.split(',').map(s => s.trim());
        }
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          title: newProject.title,
          description: newProject.description,
          required_skills: skillsArray,
          min_budget: newProject.min_budget || newProject.budget,
          max_budget: newProject.max_budget,
          deadline: newProject.deadline,
          author_id: newProject.author_id,
          status: newProject.status,
          job_poster_name: newProject.job_poster_name,
          company_name: newProject.company_name,
          location: newProject.location,
          job_type: newProject.job_type,
          experience_level: newProject.experience_level,
          application_deadline: newProject.application_deadline,
          application_link: newProject.application_link,
          attachment_url: newProject.attachment_url,
          application_methods: newProject.application_methods,
          application_method: newProject.application_method,
          allow_whatsapp_apply: newProject.allow_whatsapp_apply,
          allow_normal_apply: newProject.allow_normal_apply,
          is_featured: newProject.is_featured
        })
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

  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: Partial<Project> & { id: string, allow_whatsapp_apply?: boolean, allow_normal_apply?: boolean, whatsapp_number?: string }) => {
      const { id, budget, whatsapp_number, required_skills, ...projectData } = updatedProject;

      if (whatsapp_number && user?.id) {
        await supabase
          .from("profiles")
          .update({ whatsapp_number: whatsapp_number })
          .eq("id", user.id);
      }

      let skillsArray: string[] | undefined;

      if (required_skills !== undefined) {
        if (Array.isArray(required_skills)) {
          skillsArray = required_skills;
        } else if (typeof required_skills === 'string') {
          const skillsText = required_skills as string;
          if (skillsText.trim() !== '') {
            skillsArray = skillsText.split(',').map(s => s.trim());
          } else {
            skillsArray = [];
          }
        } else {
          skillsArray = [];
        }
      }

      const { data, error } = await supabase
        .from("projects")
        .update({
          ...projectData,
          min_budget: budget,
          max_budget: updatedProject.max_budget,
          required_skills: skillsArray,
          company_name: updatedProject.company_name,
          location: updatedProject.location,
          job_type: updatedProject.job_type,
          experience_level: updatedProject.experience_level,
          application_deadline: updatedProject.application_deadline,
          application_link: updatedProject.application_link,
          attachment_url: updatedProject.attachment_url,
          job_poster_name: updatedProject.job_poster_name,
          application_methods: updatedProject.application_methods,
          application_method: updatedProject.application_method,
          is_featured: updatedProject.is_featured
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

  const getFilteredAndSortedProjects = () => {
    // First filter by search term
    const filtered = projects.filter(project => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        project.title?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.company_name?.toLowerCase().includes(searchLower) ||
        project.location?.toLowerCase().includes(searchLower) ||
        project.job_type?.toLowerCase().includes(searchLower) ||
        (Array.isArray(project.required_skills)
          ? project.required_skills.some(skill => skill.toLowerCase().includes(searchLower))
          : String(project.required_skills || "").toLowerCase().includes(searchLower))
      );
    });

    // Then sort based on selected option
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "budget-high":
          const maxBudgetA = a.max_budget || a.min_budget || a.budget || 0;
          const maxBudgetB = b.max_budget || b.min_budget || b.budget || 0;
          return maxBudgetB - maxBudgetA;
        case "budget-low":
          const minBudgetA = a.min_budget || a.budget || 0;
          const minBudgetB = b.min_budget || b.budget || 0;
          return minBudgetA - minBudgetB;
        case "deadline":
          if (!a.application_deadline && !b.application_deadline) return 0;
          if (!a.application_deadline) return 1;
          if (!b.application_deadline) return -1;
          return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
        default:
          return 0;
      }
    });
  };









  const renderProjectCard = (project: Project) => (
    <div
      key={project.id}
      className="bg-card hover:bg-card/80 border border-border hover:border-primary/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
    >
      <JobListItem
        project={project}
        hasApplied={hasApplied(project.id)}
        onApply={(project) => {
          if (!user) {
            toast({
              title: "Authentication Required",
              description: "Please sign in to apply for this project",
              variant: "destructive",
            });
            navigate('/auth', { state: { from: `/freelancing` } });
            return;
          }
          setSelectedProject(project);
          setIsApplicationDialogOpen(true);
        }}
        featured={project.is_featured}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="w-1.5 h-10 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full mr-3"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Freelancing Hub</h1>
          </div>
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
            <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3 gap-4 p-1 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-md">
              <TabsTrigger value="browse" className="text-lg font-medium">Browse Projects</TabsTrigger>
              <TabsTrigger value="applied" className="text-lg font-medium">Applied Projects</TabsTrigger>
              <TabsTrigger value="received" className="text-lg font-medium">Received Applications</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Available Projects</h2>
                <div className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                  {getFilteredAndSortedProjects().length || 0} Projects
                </div>
              </div>
              <Button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              >
                Post a Project
              </Button>
            </div>

            {/* Search and Sort Controls */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by title, description, skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="w-full md:w-64">
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="budget-high">Highest Budget</SelectItem>
                      <SelectItem value="budget-low">Lowest Budget</SelectItem>
                      <SelectItem value="deadline">Deadline (Soonest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoadingProjects ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {(() => {
                  const filteredProjects = getFilteredAndSortedProjects();

                  if (filteredProjects.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2 dark:text-white">
                          {searchTerm ? "No matching projects found" : "No Projects Available"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                          {searchTerm
                            ? `No projects match your search for "${searchTerm}". Try different keywords or clear the search.`
                            : "There are no projects available at the moment. Check back later or post your own project!"}
                        </p>
                        {searchTerm && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setSearchTerm("")}
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredProjects.map((project) => (
                        renderProjectCard(project)
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Applied Projects</h2>
              <div className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                {projects.filter((project) => hasApplied(project.id)).length || 0} Applications
              </div>
            </div>
            {isLoadingUserApplications ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {projects
                  .filter((project) => hasApplied(project.id))
                  .length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center">
                      <Briefcase className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 dark:text-white">No Applications Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">You haven't applied to any projects yet. Browse available projects and start applying!</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects
                      .filter((project) => hasApplied(project.id))
                      .map((project) => (
                        renderProjectCard(project)
                      ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Received Applications</h2>
              <div className="ml-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                {receivedApplications.length || 0} Applications
              </div>
            </div>

            {isLoadingReceivedApplications ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {receivedApplications.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 dark:text-white">No Applications Received</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">You haven't received any applications yet. Post attractive projects to get more applications!</p>
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
                    const maxBudget = formData.get("max_budget") ? Number(formData.get("max_budget")) : null;
                    const applicationDeadline = String(formData.get("application_deadline") || "");
                    const whatsappNumber = String(formData.get("whatsapp_number") || "");
                    const allowWhatsapp = !!formData.get("allow_whatsapp_apply");
                    const allowNormal = !!formData.get("allow_normal_apply");
                    const isFeatured = !!formData.get("is_featured");
                    const companyName = String(formData.get("company_name") || "");
                    const location = String(formData.get("location") || "");
                    const jobType = String(formData.get("job_type") || "");
                    const experienceLevel = String(formData.get("experience_level") || "");
                    const applicationLink = String(formData.get("application_link") || "");
                    const attachmentUrl = String(formData.get("attachment_url") || "");
                    const jobPosterName = String(formData.get("job_poster_name") || "");

                    // Handle application methods
                    const applicationMethods: ('direct' | 'inbuilt' | 'whatsapp')[] = [];
                    if (formData.get("application_method_inbuilt")) applicationMethods.push('inbuilt');
                    if (formData.get("application_method_direct")) applicationMethods.push('direct');
                    if (formData.get("application_method_whatsapp")) applicationMethods.push('whatsapp');

                    updateProjectMutation.mutate({
                      id: selectedProject.id,
                      title,
                      description,
                      required_skills: skills,
                      budget,
                      max_budget: maxBudget,
                      application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined,
                      whatsapp_number: whatsappNumber,
                      allow_whatsapp_apply: allowWhatsapp,
                      allow_normal_apply: allowNormal,
                      is_featured: isFeatured,
                      company_name: companyName,
                      location: location,
                      job_type: jobType,
                      experience_level: experienceLevel,
                      application_link: applicationLink,
                      attachment_url: attachmentUrl,
                      job_poster_name: jobPosterName,
                      application_methods: applicationMethods.length > 0 ? applicationMethods : undefined,
                      application_method: applicationMethods.length > 0 ? applicationMethods[0] : undefined
                    });
                  }}
                  className="space-y-6 p-2"
                >
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={selectedProject?.title} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={selectedProject?.description} />
                  </div>
                  <div>
                    <Label htmlFor="skills">Skills</Label>
                    <Input
                      id="skills"
                      name="skills"
                      placeholder="Add skills (comma separated)"
                      defaultValue={
                        Array.isArray(selectedProject?.required_skills)
                          ? selectedProject?.required_skills?.join(",")
                          : selectedProject?.required_skills || ""
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget">Min Budget</Label>
                      <Input id="budget" name="budget" type="number" defaultValue={selectedProject?.min_budget || selectedProject?.budget} />
                    </div>
                    <div>
                      <Label htmlFor="max_budget">Max Budget</Label>
                      <Input id="max_budget" name="max_budget" type="number" defaultValue={selectedProject?.max_budget} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input id="company_name" name="company_name" defaultValue={selectedProject?.company_name} />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" defaultValue={selectedProject?.location} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_type">Job Type</Label>
                      <select
                        id="job_type"
                        name="job_type"
                        defaultValue={selectedProject?.job_type || ""}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="">Select Job Type</option>
                        {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="experience_level">Experience Level</Label>
                      <select
                        id="experience_level"
                        name="experience_level"
                        defaultValue={selectedProject?.experience_level || ""}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="">Select Experience Level</option>
                        {["Entry Level", "Junior", "Mid-Level", "Senior", "Lead", "Manager", "Executive"].map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_poster_name">Job Poster Name</Label>
                      <Input id="job_poster_name" name="job_poster_name" defaultValue={selectedProject?.job_poster_name} />
                    </div>
                    <div>
                      <Label htmlFor="application_deadline">Application Deadline *</Label>
                      <Input
                        id="application_deadline"
                        name="application_deadline"
                        type="date"
                        defaultValue={selectedProject?.application_deadline}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Application Methods</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="application_method_inbuilt"
                          name="application_method_inbuilt"
                          checked={selectedProject?.application_methods?.includes('inbuilt')}
                        />
                        <Label htmlFor="application_method_inbuilt" className="cursor-pointer">Inbuilt App Apply (Web App Form)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="application_method_direct"
                          name="application_method_direct"
                          checked={selectedProject?.application_methods?.includes('direct')}
                        />
                        <Label htmlFor="application_method_direct" className="cursor-pointer">Direct Apply (External Link Redirect)</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="application_method_whatsapp"
                          name="application_method_whatsapp"
                          checked={selectedProject?.application_methods?.includes('whatsapp')}
                        />
                        <Label htmlFor="application_method_whatsapp" className="cursor-pointer">WhatsApp Apply</Label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Select one or more application methods</p>
                  </div>

                  <div>
                    <Label htmlFor="application_link">Application Link</Label>
                    <Input id="application_link" name="application_link" defaultValue={selectedProject?.application_link} />
                    <p className="text-xs text-muted-foreground mt-1">Required for Direct Apply method</p>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input id="whatsapp_number" name="whatsapp_number" defaultValue={selectedProject?.author?.whatsapp_number} />
                    <p className="text-xs text-muted-foreground mt-1">Required for WhatsApp Apply method</p>
                  </div>

                  <div>
                    <Label htmlFor="attachment_url">Attachment URL</Label>
                    <Input id="attachment_url" name="attachment_url" defaultValue={selectedProject?.attachment_url} />
                    <p className="text-xs text-muted-foreground mt-1">Link to additional job details or documents</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="allow_whatsapp_apply" name="allow_whatsapp_apply" checked={selectedProject?.allow_whatsapp_apply} />
                    <Label htmlFor="allow_whatsapp_apply">Allow WhatsApp Apply</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="allow_normal_apply" name="allow_normal_apply" checked={selectedProject?.allow_normal_apply} />
                    <Label htmlFor="allow_normal_apply">Allow Normal Apply</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="is_featured" name="is_featured" checked={selectedProject?.is_featured} />
                    <Label htmlFor="is_featured">Mark as featured job</Label>
                  </div>

                  <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={updateProjectMutation.isPending}
                    >
                      {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedProject && deleteProjectMutation.mutate(selectedProject.id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <NewProjectDialog
          isOpen={isNewProjectModalOpen}
          onOpenChange={setIsNewProjectModalOpen}
          onProjectCreated={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
          onSubmit={handleCreateProject}
          isSubmitting={createProjectMutation.isPending}
        />

        {selectedProject && (
          <ApplicationDialog
            isOpen={isApplicationDialogOpen}
            onOpenChange={setIsApplicationDialogOpen}
            project={selectedProject}
            message={applicationMessage}
            onMessageChange={setApplicationMessage}
            onSubmit={handleApplyToProject}
            isSubmitting={applyProjectMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default Freelancing;
