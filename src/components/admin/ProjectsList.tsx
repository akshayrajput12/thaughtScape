import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Briefcase, 
  Calendar, 
  FileText, 
  Users, 
  Trash, 
  Eye,
  Plus,
  RefreshCw,
  ChevronRight,
  User
} from "lucide-react";
import type { Project, ProjectApplication } from "@/types";
import { ProjectApplicationCard } from "@/components/freelancing/ProjectApplicationCard";
import { NewProjectDialog } from "@/pages/freelancing/components/NewProjectDialog";

export const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          client:profiles(
            id,
            username,
            full_name,
            avatar_url
          ),
          freelancer:profiles(
            id,
            username,
            full_name,
            avatar_url
          ),
          applications_count:project_applications(count),
          milestones_count:project_applications(count)
        `)
        .order('created_at', { ascending: false });

      setIsLoading(false);
      if (error) throw error;

      const projectsWithCounts = projectsData?.map(project => ({
        ...project,
        budget: project.min_budget,
        applications_count: project.applications_count || 0,
        milestones_count: project.milestones_count || 0
      })) as Project[];

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Could not fetch projects",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(project => project.id !== projectId));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Could not delete project",
        variant: "destructive",
      });
    }
  };
  
  const fetchApplications = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          applicant:profiles!project_applications_applicant_id_fkey(*)
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      const typedApplications: ProjectApplication[] = data?.map(app => ({
        ...app,
        status: app.status as 'pending' | 'accepted' | 'rejected',
      })) || [];
      
      setApplications(typedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Could not fetch project applications",
        variant: "destructive",
      });
    }
  };
  
  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    fetchApplications(project.id);
  };
  
  const handleUpdateApplicationStatus = async (applicationId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from('project_applications')
        .update({ status })
        .eq('id', applicationId);
        
      if (error) throw error;
      
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId ? { ...app, status } : app
        )
      );
      
      toast({
        title: "Success",
        description: `Application ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Could not update application status",
        variant: "destructive",
      });
    }
  };
  
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setShowNewProjectDialog(false);
    toast({
      title: "Success",
      description: "Project created successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          onClick={fetchProjects}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Loading..." : "Refresh Projects"}
        </Button>
        
        <Button 
          onClick={() => setShowNewProjectDialog(true)}
          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Project
        </Button>
      </div>
      
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Project Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
              <div className="md:w-1/2 space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <User size={14} />
                    <span>Posted by {selectedProject.author?.full_name || selectedProject.author?.username}</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-700">{selectedProject.description}</div>
                  
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700">Required Skills:</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedProject.required_skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Budget:</div>
                      <div className="text-green-600 font-medium">
                        ₹{selectedProject.min_budget}{selectedProject.max_budget ? ` - ₹${selectedProject.max_budget}` : ''}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Deadline:</div>
                      <div className="text-gray-600">
                        {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Status:</div>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          selectedProject.status === 'open' 
                            ? 'border-green-200 text-green-700 bg-green-50' 
                            : selectedProject.status === 'in_progress'
                            ? 'border-blue-200 text-blue-700 bg-blue-50'
                            : 'border-gray-200 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {selectedProject.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                    <Users size={16} />
                    Applications ({applications.length})
                  </h3>
                </div>
                
                {applications.length > 0 ? (
                  <ScrollArea className="flex-1 h-[300px] pr-4">
                    <div className="space-y-4">
                      {applications.map(application => (
                        <ProjectApplicationCard
                          key={application.id}
                          application={application}
                          onUpdateStatus={handleUpdateApplicationStatus}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No applications yet</p>
                  </div>
                )}
              </div>
              
              <div className="md:w-1/2">
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-md font-medium text-gray-900 flex items-center gap-2 mb-3">
                    <Calendar size={16} />
                    Project Timeline
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 rounded-full p-1.5">
                        <Briefcase size={14} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Project Created</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedProject.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {selectedProject.status === 'in_progress' && (
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 rounded-full p-1.5">
                          <Users size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Project Started</p>
                          <p className="text-xs text-gray-500">
                            Freelancer assigned
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedProject.status === 'closed' && (
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-full p-1.5">
                          <FileText size={14} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Project Completed</p>
                          <p className="text-xs text-gray-500">
                            Successfully delivered
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    variant="outline"
                    onClick={() => {
                      handleDeleteProject(selectedProject.id);
                      setSelectedProject(null);
                    }}
                  >
                    <Trash size={16} className="mr-2" />
                    Delete Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">
                  ₹{project.budget || project.min_budget}
                </Badge>
                <Badge variant="secondary" className={`capitalize
                  ${project.status === 'open' ? 'bg-green-50 text-green-600' : 
                    project.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 
                    'bg-gray-50 text-gray-600'}
                `}>
                  {project.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Skills: </span>
                  <span className="text-gray-700">
                    {project.required_skills.slice(0, 3).join(', ')}
                    {project.required_skills.length > 3 && '...'}
                  </span>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-500">Applications: </span>
                  <span className="text-purple-600 font-medium">
                    {typeof project.applications_count === 'number' 
                      ? project.applications_count 
                      : project.applications_count?.[0]?.count || 0}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProject(project)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200"
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                    >
                      <Trash size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <NewProjectDialog 
        isOpen={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
