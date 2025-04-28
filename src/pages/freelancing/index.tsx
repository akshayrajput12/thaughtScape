import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Project } from "@/types";
import { EnhancedProjectsList } from "./components/EnhancedProjectsList";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const FreelancingPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromParams = searchParams.get('projectId');

  const { data: initialProjects, isLoading: initialLoading } = useQuery({
    queryKey: ['initialProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            whatsapp_number,
            created_at,
            updated_at
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure the status is properly cast to the expected type
      if (data) {
        const typedProjects = data.map(project => ({
          ...project,
          status: project.status as "open" | "closed" | "in_progress"
        }));
        
        return typedProjects as Project[];
      } else {
        return [] as Project[];
      }
    },
  });

  useEffect(() => {
    if (initialProjects) {
      setProjects(initialProjects);
    }
  }, [initialProjects]);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        author:profiles!projects_author_id_fkey(
          id,
          username,
          full_name,
          avatar_url,
          whatsapp_number,
          created_at,
          updated_at
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } else {
      // Ensure the status is properly cast to the expected type
      if (data) {
        const typedProjects = data.map(project => ({
          ...project,
          status: project.status as "open" | "closed" | "in_progress"
        }));
        
        setProjects(typedProjects as Project[]);
      } else {
        setProjects([]);
      }
    }
  }, [toast]);

  const fetchUserApplications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('project_applications')
        .select('project_id')
        .eq('applicant_id', user.id);

      if (error) throw error;

      setUserApplications(data.map(app => app.project_id));
    } catch (error) {
      console.error("Error fetching user applications:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjects();
    fetchUserApplications();
  }, [fetchProjects, fetchUserApplications]);

  useEffect(() => {
    if (projectIdFromParams) {
      setSelectedProject({ id: projectIdFromParams } as Project);
      setIsApplicationDialogOpen(true);
    }
  }, [projectIdFromParams]);

  const handleApplyToProject = (project: Project) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for this project",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setSelectedProject(project);
    setIsApplicationDialogOpen(true);
  };

  const applicationSchema = z.object({
    message: z.string().min(10, { message: "Message must be at least 10 characters." }),
    phoneNumber: z.string().optional(),
    experience: z.string().optional(),
    portfolio: z.string().optional(),
    education: z.string().optional(),
    skills: z.string().optional(),
    expectedSalary: z.string().optional(),
  });

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      message: "",
      phoneNumber: "",
      experience: "",
      portfolio: "",
      education: "",
      skills: "",
      expectedSalary: ""
    },
  });

  const handleSubmitApplication = async (values: any) => {
    if (!user?.id || !selectedProject?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to apply",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the application object with the correct properties
      const applicationData = {
        projectId: selectedProject.id,
        message: values.message,
        phoneNumber: values.phoneNumber,
        experience: values.experience,
        portfolio: values.portfolio,
        education: values.education,
        skills: values.skills?.split(',').map((skill: string) => skill.trim()) || [],
        expectedSalary: values.expectedSalary ? parseFloat(values.expectedSalary) : undefined
      };

      // Make the API call with correctly named fields
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: applicationData.projectId,
          applicant_id: user.id,
          message: applicationData.message,
          phone_number: applicationData.phoneNumber,
          experience: applicationData.experience,
          portfolio: applicationData.portfolio,
          education: applicationData.education,
          skills: applicationData.skills,
          expected_salary: applicationData.expectedSalary
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully",
      });

      // Close the dialog and refresh applications
      setIsApplicationDialogOpen(false);
      fetchProjects();
      fetchUserApplications();
      navigate('/freelancing');
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Freelancing Opportunities</h1>

        {initialLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse">
                <Skeleton className="h-5 sm:h-6 w-2/3 mb-3 sm:mb-4" />
                <Skeleton className="h-3 sm:h-4 w-full mb-2" />
                <Skeleton className="h-3 sm:h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          <EnhancedProjectsList
            projects={projects}
            userApplications={userApplications}
            onApply={handleApplyToProject}
            isLoading={initialLoading}
          />
        )}

        <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
          <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Project Application</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Submit your application for this project.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitApplication)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Why are you a good fit for this project?"
                          className="resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your phone number" 
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Experience (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your relevant experience"
                          className="resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portfolio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Portfolio (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Link to your portfolio" 
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Education (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your educational background"
                          className="resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Skills (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="List your skills, separated by commas" 
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-300">Expected Salary (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your expected salary" 
                          type="number" 
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setIsApplicationDialogOpen(false)}
                    className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FreelancingPage;
