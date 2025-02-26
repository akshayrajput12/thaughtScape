import { useState, useEffect } from "react";
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
import { Calendar, Briefcase, Clock, Mail, User, CheckCircle2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Project, ProjectApplication } from "@/types";

const queryFunctions = {
  fetchProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        author:profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return data?.map(project => ({
      ...project,
      status: project.status as 'open' | 'closed' | 'in_progress'
    })) || [];
  },

  fetchUserApplications: async (userId: string) => {
    const { data, error } = await supabase
      .from('project_applications')
      .select('project_id')
      .eq('applicant_id', userId);

    if (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }

    return data.map(app => app.project_id);
  },

  fetchAppliedProjects: async (userId: string) => {
    const { data, error } = await supabase
      .from('project_applications')
      .select(`
        *,
        project:projects(
          *,
          author:profiles(*)
        )
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applied projects:', error);
      throw error;
    }

    return data || [];
  },

  fetchReceivedApplications: async (userId: string) => {
    const { data, error } = await supabase
      .from('project_applications')
      .select(`
        *,
        applicant:profiles(*),
        project:projects(*)
      `)
      .eq('project.author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received applications:', error);
      throw error;
    }

    return data || [];
  }
};

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: queryFunctions.fetchProjects,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    meta: {
      errorMessage: "Failed to load projects"
    },
    networkMode: 'always'
  });

  const { data: appliedProjects = [], isLoading: isLoadingAppliedProjects } = useQuery({
    queryKey: ['applied-projects', user?.id],
    queryFn: () => queryFunctions.fetchAppliedProjects(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    meta: {
      errorMessage: "Failed to load your applications"
    },
    networkMode: 'always'
  });

  const { data: receivedApplications = [], isLoading: isLoadingReceivedApplications } = useQuery({
    queryKey: ['received-applications', user?.id],
    queryFn: () => queryFunctions.fetchReceivedApplications(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    meta: {
      errorMessage: "Failed to load received applications"
    },
    networkMode: 'always'
  });

  const { data: userApplications = [] } = useQuery({
    queryKey: ['user-applications', user?.id],
    queryFn: () => queryFunctions.fetchUserApplications(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    meta: {
      errorMessage: "Failed to fetch user applications"
    },
    networkMode: 'always'
  });

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'error' && event.query.meta?.errorMessage) {
        toast({
          title: "Error",
          description: event.query.meta.errorMessage as string,
          variant: "destructive",
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, toast]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="browse" className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Freelance Projects</h1>
              <p className="text-gray-600">Find your next opportunity or post a project</p>
            </div>
            <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
              <TabsTrigger value="browse" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Browse Projects
              </TabsTrigger>
              <TabsTrigger value="applied" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Applied
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Inquiries
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
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
                {projects.map((project) => {
                  const hasApplied = userApplications.includes(project.id);
                  
                  return (
                    <div key={project.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
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
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
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
                          hasApplied ? (
                            <Button variant="outline" disabled className="border-2 border-green-200 text-green-700">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Applied
                            </Button>
                          ) : (
                            <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => setSelectedProject({
                                    ...project,
                                    status: project.status as 'open' | 'closed' | 'in_progress'
                                  })}
                                  variant="outline"
                                  className="border-2 border-black hover:bg-black hover:text-white transition-colors"
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
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-black">Applied Projects</h2>
              {isLoadingAppliedProjects ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                      <Skeleton className="h-8 w-2/3 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                    </div>
                  ))}
                </div>
              ) : appliedProjects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You haven't applied to any projects yet.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {appliedProjects.map((application) => (
                    <div key={application.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {application.project.title}
                          </h3>
                          <p className="text-gray-600">{application.message}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            application.status === 'accepted' 
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inquiries">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-black">Project Inquiries</h2>
              {isLoadingReceivedApplications ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                      <Skeleton className="h-8 w-2/3 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                    </div>
                  ))}
                </div>
              ) : receivedApplications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No inquiries received yet.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {receivedApplications.map((application) => (
                    <div key={application.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={application.applicant?.avatar_url || "/placeholder.svg"}
                              alt={application.applicant?.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {application.applicant?.username}
                              </h3>
                              <p className="text-sm text-gray-500">
                                For project: {application.project.title}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">{application.message}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            application.status === 'accepted' 
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          Received {format(new Date(application.created_at), 'MMM d, yyyy')}
                        </div>
                        {application.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => {
                                // Handle accept
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                // Handle reject
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Freelancing;
