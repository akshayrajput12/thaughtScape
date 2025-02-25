import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { Briefcase } from "lucide-react";
import type { Project, ProjectApplication } from "@/types";

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          author:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(project => ({
        ...project,
        status: project.status as 'open' | 'closed' | 'in_progress'
      }));
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user?.id) throw new Error("Must be logged in to create a project");

      const projectData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        required_skills: (formData.get('required_skills') as string).split(',').map(s => s.trim()),
        budget: parseFloat(formData.get('budget') as string),
        deadline: formData.get('deadline') as string,
        author_id: user.id,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsNewProjectDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const applyToProjectMutation = useMutation({
    mutationFn: async ({ projectId, message }: { projectId: string; message: string }) => {
      if (!user?.id) throw new Error("Must be logged in to apply");

      const { data, error } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          applicant_id: user.id,
          message,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsApplicationDialogOpen(false);
      toast({
        title: "Success",
        description: "Application submitted successfully",
      });
    },
    onError: (error) => {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProjectMutation.mutate(formData);
  };

  const handleApplyToProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;

    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;

    applyToProjectMutation.mutate({
      projectId: selectedProject.id,
      message,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
            Freelance Projects
          </h1>
          <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Briefcase className="w-5 h-5 mr-2" />
                Post New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                  Create New Project
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Share your project details and find the perfect freelancer.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Project Title
                  </label>
                  <Input 
                    id="title" 
                    name="title" 
                    required 
                    className="w-full px-4 py-2 border-2 border-purple-100 focus:border-purple-500 rounded-lg shadow-sm transition-all duration-300"
                    placeholder="Enter a clear, descriptive title..."
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Project Description
                  </label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    required
                    className="w-full px-4 py-2 border-2 border-purple-100 focus:border-purple-500 rounded-lg shadow-sm transition-all duration-300"
                    placeholder="Describe your project requirements in detail..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="required_skills" className="block text-sm font-medium text-gray-700">
                    Required Skills
                  </label>
                  <Input 
                    id="required_skills" 
                    name="required_skills" 
                    required
                    className="w-full px-4 py-2 border-2 border-purple-100 focus:border-purple-500 rounded-lg shadow-sm transition-all duration-300"
                    placeholder="e.g., React, TypeScript, Node.js..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                      Budget ($)
                    </label>
                    <Input 
                      id="budget" 
                      name="budget" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      required
                      className="w-full px-4 py-2 border-2 border-purple-100 focus:border-purple-500 rounded-lg shadow-sm transition-all duration-300"
                      placeholder="Enter your budget..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                      Deadline
                    </label>
                    <Input 
                      id="deadline" 
                      name="deadline" 
                      type="datetime-local" 
                      required
                      className="w-full px-4 py-2 border-2 border-purple-100 focus:border-purple-500 rounded-lg shadow-sm transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsNewProjectDialogOpen(false)}
                    className="border-2 border-purple-200 hover:border-purple-300 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProjectMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {createProjectMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingProjects ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">${project.budget}</p>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(project.deadline), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <img
                      src={project.author?.avatar_url || "/placeholder.svg"}
                      alt={project.author?.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      Posted by {project.author?.username}
                    </span>
                  </div>
                  
                  {user?.id !== project.author_id && (
                    <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setSelectedProject({
                              ...project,
                              status: project.status as 'open' | 'closed' | 'in_progress'
                            });
                          }}
                          variant="outline"
                        >
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply to Project</DialogTitle>
                          <DialogDescription>
                            Send your application for "{project.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleApplyToProject} className="space-y-4">
                          <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                              Your Message
                            </label>
                            <Textarea
                              id="message"
                              name="message"
                              placeholder="Explain why you're a good fit for this project..."
                              required
                              rows={5}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsApplicationDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={applyToProjectMutation.isPending}
                            >
                              {applyToProjectMutation.isPending ? "Sending..." : "Send Application"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Freelancing;
