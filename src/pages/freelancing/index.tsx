import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectsList } from "./components/ProjectsList";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

const FreelancingPage = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", categoryParam],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url, created_at, updated_at, whatsapp_number),
          applications:project_applications(count),
          comments:project_applications(count)
        `)
        .order("created_at", { ascending: false });
      
      if (categoryParam) {
        query = query.eq("category", categoryParam);
      }
      
      const { data, error } = await query;
      
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

  const handleProjectCreated = (project: Project) => {
    toast({
      title: "Success",
      description: "Project created successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Freelancing Hub</h1>
        </div>

        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3 gap-4">
            <TabsTrigger value="browse" className="text-lg">Browse Projects</TabsTrigger>
            <TabsTrigger value="applied" className="text-lg">Applied Projects</TabsTrigger>
            <TabsTrigger value="received" className="text-lg">Received Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-gray-900">Available Projects</h2>
              <Button onClick={() => setIsNewProjectModalOpen(true)}>Post a Project</Button>
            </div>

            <ProjectsList projects={projects} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Applied Projects</h2>
            {/* Applied projects content */}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Received Applications</h2>
            {/* Received applications content */}
          </TabsContent>
        </Tabs>

        <NewProjectDialog 
          isOpen={isNewProjectModalOpen}
          onOpenChange={setIsNewProjectModalOpen}
          onSubmit={(project) => {
            // Handle project submission
            setIsNewProjectModalOpen(false);
          }}
          isSubmitting={false}
          onProjectCreated={handleProjectCreated}
        />
      </div>
    </div>
  );
};

export default FreelancingPage;
