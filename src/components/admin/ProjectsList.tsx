import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Trash, Eye, Edit, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import type { Project } from "@/types";

export const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("projects")
          .select(`
            *,
            author:profiles(id, username, full_name, avatar_url, created_at, updated_at)
          `)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        setProjects(data.map(project => ({
          ...project,
          status: project.status as "open" | "closed" | "in_progress"
        })) as Project[]);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Could not load projects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete);
      
      if (error) throw error;
      
      setProjects((current) => current.filter(project => project.id !== projectToDelete));
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setProjectToDelete(null);
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "closed":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="line-clamp-1 font-medium">{project.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {project.description?.substring(0, 50)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeStyles(project.status || "open")}>
                      {project.status?.toUpperCase() || "OPEN"}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.author?.full_name || project.author?.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {project.min_budget?.toLocaleString('en-IN') || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.created_at ? format(new Date(project.created_at), "PP") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/project/${project.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setProjectToDelete(project.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
