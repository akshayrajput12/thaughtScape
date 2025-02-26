
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, User, CheckCircle2, Calendar } from "lucide-react";
import clsx from "clsx";
import type { Project, ProjectApplication } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";

const Freelancing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, author:profiles(username, full_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
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

  const { data: receivedApplications = [], isLoading: isLoadingReceivedApplications } = useQuery({
    queryKey: ["receivedApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select(`*, applicant:profiles(username, full_name, avatar_url)`)
        .in(
          "project_id",
          projects?.filter((project) => project.author_id === user.id).map((project) => project.id) || []
        );
      if (error) throw error;
      return data as ProjectApplication[];
    },
    enabled: !!user?.id,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Omit<Project, "id" | "created_at" | "updated_at" | "author">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert([newProject])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsNewProjectDialogOpen(false);
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

  const applyProjectMutation = useMutation({
    mutationFn: async ({ projectId, message }: { projectId: string; message: string }) => {
      const { data, error } = await supabase
        .from("project_applications")
        .insert([{
          project_id: projectId,
          applicant_id: user?.id,
          message,
          status: "pending" as const,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userApplications", user?.id] });
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
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: "accepted" | "rejected" }) => {
      const { data, error } = await supabase
        .from("project_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedApplications", user?.id] });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3 gap-4">
            <TabsTrigger value="browse" className="text-lg">Browse Projects</TabsTrigger>
            <TabsTrigger value="applied" className="text-lg">Applied Projects</TabsTrigger>
            <TabsTrigger value="received" className="text-lg">Received Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-gray-900">Available Projects</h2>
              <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Post New Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Post a New Project</DialogTitle>
                    <DialogDescription>
                      Provide details about the project you want to create.
                    </DialogDescription>
                  </DialogHeader>
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
                      const deadline = String(formData.get("deadline"));

                      createProjectMutation.mutate({
                        title,
                        description,
                        required_skills: skills,
                        budget,
                        deadline,
                        author_id: user?.id as string,
                        status: "open",
                      });
                    }}
                    className="grid gap-4 py-4"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" type="text" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="skills">Required Skills (comma-separated)</Label>
                      <Input id="skills" name="skills" type="text" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget">Budget (₹)</Label>
                      <Input id="budget" name="budget" type="number" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input id="deadline" name="deadline" type="date" required />
                    </div>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={createProjectMutation.isPending}>
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingProjects ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm animate-pulse">
                    <Skeleton className="h-6 w-2/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <IndianRupee className="w-4 h-4" />
                        <span className="text-sm">Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm">{project.author?.full_name || project.author?.username}</span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        {
                          "bg-green-100 text-green-800": project.status === "open",
                          "bg-yellow-100 text-yellow-800": project.status === "in_progress",
                          "bg-gray-100 text-gray-800": project.status === "closed"
                        }
                      )}>
                        {project.status?.toUpperCase()}
                      </span>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsApplicationDialogOpen(true);
                        }}
                        disabled={project.status !== "open" || project.author_id === user?.id || userApplications.includes(project.id)}
                      >
                        {userApplications.includes(project.id) ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Applied
                          </span>
                        ) : (
                          "Apply Now"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="space-y-6">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Applied Projects</h2>
            {isLoadingUserApplications ? (
              <div>Loading...</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects
                  ?.filter((project) => userApplications.includes(project.id))
                  .map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100"
                    >
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Deadline: {project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-sm">Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{project.author?.full_name || project.author?.username}</span>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                        <span className={clsx(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          {
                            "bg-green-100 text-green-800": project.status === "open",
                            "bg-yellow-100 text-yellow-800": project.status === "in_progress",
                            "bg-gray-100 text-gray-800": project.status === "closed"
                          }
                        )}>
                          {project.status?.toUpperCase()}
                        </span>
                        <Button variant="secondary" size="sm" disabled>
                          Applied
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Received Applications</h2>
            {isLoadingReceivedApplications ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-4">
                {receivedApplications.length === 0 ? (
                  <p>No applications received yet.</p>
                ) : (
                  receivedApplications.map((application) => (
                    <div
                      key={application.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100"
                    >
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.applicant?.full_name || application.applicant?.username}
                        </h3>
                        <p className="text-sm text-gray-600">{application.message}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Status: {application.status.toUpperCase()}
                        </span>
                        <div className="flex gap-2">
                          {application.status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  updateApplicationStatusMutation.mutate({
                                    applicationId: application.id,
                                    status: "accepted",
                                  })
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  updateApplicationStatusMutation.mutate({
                                    applicationId: application.id,
                                    status: "rejected",
                                  })
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Project</DialogTitle>
            <DialogDescription>
              Write a message to the project owner to express your interest.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedProject) {
                applyProjectMutation.mutate({
                  projectId: selectedProject.id,
                  message: applicationMessage,
                });
              }
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={applyProjectMutation.isPending}>
                {applyProjectMutation.isPending ? "Applying..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Freelancing;
