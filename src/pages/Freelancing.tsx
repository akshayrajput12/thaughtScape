
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/freelancing/components/ProjectCard";
import { NewProjectModal } from "@/components/freelancing/components/NewProjectModal";
import { FreelanceHeader } from "@/components/freelancing/components/FreelanceHeader";
import type { Project } from "@/types";

const Freelancing = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBudget, setFilterBudget] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, created_at, updated_at)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
        throw error;
      }
      
      // Map the data to include the required category field
      return data.map(project => ({
        ...project,
        budget: project.min_budget || 0,
        category: project.job_type || "other",
        status: (project.status || 'open') as "open" | "closed" | "in_progress"
      })) as Project[];
    },
  });

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async (newProject: Omit<Project, 'id' | 'created_at' | 'author'>) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({ 
          ...newProject,
          author_id: user.id,
          job_type: newProject.category // Store category in job_type field
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      // Map the response to include the required category field
      return {
        ...data,
        budget: data.min_budget || 0,
        category: data.job_type || "other",
        status: (data.status || 'open') as "open" | "closed" | "in_progress"
      } as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsNewProjectModalOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = searchTerm === "" || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "all" || project.category === filterCategory;
    
    const matchesBudget = filterBudget === "all" || (
      filterBudget === "under5k" && project.budget < 5000 ||
      filterBudget === "5kTo15k" && project.budget >= 5000 && project.budget <= 15000 ||
      filterBudget === "above15k" && project.budget > 15000
    );

    return matchesSearch && matchesCategory && matchesBudget;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <FreelanceHeader 
          onNewProject={() => setIsNewProjectModalOpen(true)}
          isAuthenticated={!!user}
        />
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="px-4 py-2 rounded-lg border border-border bg-background"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="technology">Technology</option>
            <option value="design">Design</option>
            <option value="writing">Writing</option>
            <option value="marketing">Marketing</option>
          </select>
          
          <select
            className="px-4 py-2 rounded-lg border border-border bg-background"
            value={filterBudget}
            onChange={(e) => setFilterBudget(e.target.value)}
          >
            <option value="all">All Budgets</option>
            <option value="under5k">Under ₹5,000</option>
            <option value="5kTo15k">₹5,000 - ₹15,000</option>
            <option value="above15k">Above ₹15,000</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-gray-100 h-48"></div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-500">Failed to load projects.</p>
      ) : filteredProjects?.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onProjectClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onOpenChange={setIsNewProjectModalOpen}
        onSubmit={createProject}
        isLoading={isPending}
      />
    </div>
  );
};

export default Freelancing;
