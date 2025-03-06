
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProjectsList } from "./components/ProjectsList";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationDialog } from "./components/ApplicationDialog";
import { ProjectCard } from "./components/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project, ProjectApplication } from "@/types";

export default function Freelancing() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterBy, setFilterBy] = useState<"all" | "my_projects" | "applied">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "budget_high" | "budget_low">("newest");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id });
      }
    };

    fetchUser();
  }, []);

  // Function to fetch projects based on filters
  const fetchProjects = async () => {
    let query = supabase
      .from("projects")
      .select(`
        *,
        author:profiles!projects_author_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        ),
        applications_count:project_applications(count)
      `)
      .order("created_at", { ascending: sortBy === "oldest" });

    if (sortBy === "budget_high" || sortBy === "budget_low") {
      query = query.order("max_budget", { ascending: sortBy === "budget_low" });
    }

    if (filterBy === "my_projects" && user?.id) {
      query = query.eq("author_id", user.id);
    } else if (filterBy === "applied" && user?.id) {
      const { data: applications, error: applicationsError } = await supabase
        .from("project_applications")
        .select("project_id")
        .eq("applicant_id", user.id);

      if (applicationsError) throw applicationsError;

      if (applications && applications.length > 0) {
        const projectIds = applications.map((app) => app.project_id);
        query = query.in("id", projectIds);
      } else {
        // No applications found, return empty array
        return [];
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data as Project[];
  };

  // Query for projects
  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", filterBy, sortBy],
    queryFn: fetchProjects,
  });

  // Mutation for creating a new project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Omit<Project, "id" | "created_at" | "updated_at" | "author_id" | "status">) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error("You must be logged in to create a project");
      }

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            ...projectData,
            author_id: session.session.user.id,
            status: "open",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setIsDialogOpen(false);
      // Refetch projects after creating a new one
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
    onError: (error) => {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle project creation
  const handleCreateProject = (projectData: Omit<Project, "id" | "created_at" | "updated_at" | "author_id" | "status">) => {
    createProjectMutation.mutate(projectData);
  };

  // Handle project selection for application
  const handleApplyClick = (project: Project) => {
    setSelectedProject(project);
    setIsApplicationDialogOpen(true);
  };

  // Function to handle project application submission
  const handleApplySubmit = async (application: Omit<ProjectApplication, "id" | "created_at" | "applicant_id" | "status">) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to apply for projects",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("project_applications")
        .insert({
          ...application,
          applicant_id: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your application has been submitted",
      });

      setIsApplicationDialogOpen(false);
      // Refetch projects after applying
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Query to check if user has applied to projects
  const { data: userApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["userApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("project_id, status")
        .eq("applicant_id", user.id);
      if (error) throw error;
      return data as { project_id: string; status: string }[];
    },
    enabled: !!user?.id,
  });

  // Function to handle project creation
  const handleProjectCreated = (project: Project) => {
    // Refetch projects after creating a new one
    queryClient.invalidateQueries({
      queryKey: ["projects"],
    });
    setIsDialogOpen(false);
  };

  if (error) {
    console.error("Error fetching projects:", error);
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Freelancing Projects</h1>
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          Error loading projects. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Freelancing Projects</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Create Project</Button>
      </div>

      {/* Filters and tabs */}
      <div className="mb-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger
              value="all"
              onClick={() => setFilterBy("all")}
              className="font-medium"
            >
              All Projects
            </TabsTrigger>
            <TabsTrigger
              value="my_projects"
              onClick={() => setFilterBy("my_projects")}
              className="font-medium"
            >
              My Projects
            </TabsTrigger>
            <TabsTrigger
              value="applied"
              onClick={() => setFilterBy("applied")}
              className="font-medium"
            >
              Applied
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
          <div className="flex space-x-2">
            <Badge
              variant={sortBy === "newest" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSortBy("newest")}
            >
              Newest
            </Badge>
            <Badge
              variant={sortBy === "oldest" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSortBy("oldest")}
            >
              Oldest
            </Badge>
            <Badge
              variant={sortBy === "budget_high" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSortBy("budget_high")}
            >
              Budget: High to Low
            </Badge>
            <Badge
              variant={sortBy === "budget_low" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSortBy("budget_low")}
            >
              Budget: Low to High
            </Badge>
          </div>
        </div>
      </div>

      {/* Projects list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <ProjectsList
          projects={projects}
          userApplications={userApplications || []}
          onApplyClick={handleApplyClick}
        />
      ) : (
        <div className="bg-gray-50 p-8 rounded-md text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            {filterBy === "all"
              ? "There are no projects available at the moment. Check back later or create your own!"
              : filterBy === "my_projects"
              ? "You haven't created any projects yet."
              : "You haven't applied to any projects yet."}
          </p>
          {filterBy !== "my_projects" && (
            <Button onClick={() => setIsDialogOpen(true)}>Create Your Project</Button>
          )}
        </div>
      )}

      {/* Create project dialog */}
      <NewProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateProject}
      />

      {/* Application dialog */}
      {selectedProject && (
        <ApplicationDialog
          open={isApplicationDialogOpen}
          onOpenChange={setIsApplicationDialogOpen}
          project={selectedProject}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
}
