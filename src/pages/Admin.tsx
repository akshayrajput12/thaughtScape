
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersList } from "@/components/admin/UsersList";
import { PoemsList } from "@/components/admin/PoemsList";
import { ProjectsList } from "@/components/admin/ProjectsList";
import { UserStats } from "@/components/admin/UserStats";
import { ProjectManagement } from "@/components/admin/ProjectManagement";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/types";

function AdminDashboard() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const queryClient = useQueryClient();

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data?.is_admin || false;
    },
    enabled: !!user?.id,
  });

  // Fetch projects for the projects management tab
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ["adminProjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!isAdmin,
  });

  // Handle URL parameters for user selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const userId = params.get("user");
    
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    if (userId) {
      setActiveTab("users");
      // Handle user selection if needed
    }
  }, [location]);

  // Redirect if not admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [checkingAdmin, isAdmin, navigate, toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL with new tab
    const params = new URLSearchParams(location.search);
    params.set("tab", value);
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, content, and settings</p>
        </div>
        
        <div className="border-b">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="poems">Thoughts</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="project-management">Project Management</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <TabsContent value="users" className="m-0">
          <UsersList />
        </TabsContent>
        
        <TabsContent value="poems" className="m-0">
          <PoemsList />
        </TabsContent>
        
        <TabsContent value="projects" className="m-0">
          <ProjectsList />
        </TabsContent>
        
        <TabsContent value="stats" className="m-0">
          <UserStats />
        </TabsContent>
        
        <TabsContent value="project-management" className="m-0">
          <ProjectManagement 
            projects={projects || []} 
            isLoading={projectsLoading} 
            onRefresh={refetchProjects}
          />
        </TabsContent>
      </div>
    </div>
  );
}

export default AdminDashboard;
