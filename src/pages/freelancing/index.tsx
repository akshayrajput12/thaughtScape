
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProjectsList } from "./components/ProjectsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "./components/NewProjectDialog";
import { ApplicationDialog } from "./components/ApplicationDialog";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types";
import { Menu, ChevronRight } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const FreelancingIndex = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("browse");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          author:profiles(id, username, full_name, avatar_url, created_at, updated_at, whatsapp_number),
          applications:project_applications(count)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      return data.map(project => ({
        ...project,
        budget: project.min_budget,
        _count: {
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleApplyToProject = (project: Project) => {
    setSelectedProject(project);
    setIsApplicationDialogOpen(true);
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
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          {!isMobile && (
            <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-2 gap-4">
              <TabsTrigger value="browse" className="text-lg">Browse Projects</TabsTrigger>
              <TabsTrigger value="applied" className="text-lg">Applied Projects</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-gray-900">Available Projects</h2>
              <Button onClick={() => setIsNewProjectDialogOpen(true)}>Post a Project</Button>
            </div>

            <ProjectsList 
              projects={projects} 
              isLoading={isLoadingProjects}
              userApplications={userApplications}
              onApply={handleApplyToProject}
            />
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Applied Projects</h2>
            
            <ProjectsList 
              projects={projects.filter(project => userApplications.includes(project.id))} 
              isLoading={isLoadingUserApplications}
              userApplications={userApplications}
              onApply={handleApplyToProject}
            />
          </TabsContent>
        </Tabs>

        <NewProjectDialog 
          isOpen={isNewProjectDialogOpen}
          onOpenChange={setIsNewProjectDialogOpen}
          onSubmit={(project) => {
            // Handle project submission
            toast({
              title: "Success",
              description: "Project created successfully!",
            });
            setIsNewProjectDialogOpen(false);
          }}
          isSubmitting={false}
        />

        <ApplicationDialog 
          isOpen={isApplicationDialogOpen}
          onOpenChange={setIsApplicationDialogOpen}
          project={selectedProject}
          message={applicationMessage}
          onMessageChange={setApplicationMessage}
          onSubmit={() => {
            toast({
              title: "Success",
              description: "Application submitted successfully!",
            });
            setIsApplicationDialogOpen(false);
            setApplicationMessage("");
          }}
          isSubmitting={false}
        />
      </div>
    </div>
  );
};

export default FreelancingIndex;
