import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, Calendar, IndianRupee, User, MessageSquare, Link as LinkIcon } from "lucide-react";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import SEO from "@/components/SEO";

const SingleProject = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Use maybeSingle instead of single to prevent 406 errors when no rows are found
        const { data, error } = await supabase
          .from("projects")
          .select(`
            *,
            author:profiles!projects_author_id_fkey(
              id,
              username,
              full_name,
              avatar_url,
              created_at,
              updated_at,
              whatsapp_number
            ),
            applications:project_applications(count),
            comments:project_applications(count)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        // If no data is found, return early
        if (!data) {
          setLoading(false);
          return;
        }

        const projectData = {
          ...data,
          // Keep both min_budget and max_budget for proper budget display
          min_budget: data.min_budget,
          max_budget: data.max_budget,
          // For backward compatibility
          budget: data.min_budget,
          _count: {
            comments: data.comments?.[0]?.count || 0,
            applications: data.applications?.[0]?.count || 0
          },
          status: data.status as "open" | "closed" | "in_progress"
        } as Project;

        setProject(projectData);

        // Check if user has applied
        if (user?.id) {
          const { data: applicationData, error: applicationError } = await supabase
            .from('project_applications')
            .select('id')
            .eq('project_id', id)
            .eq('applicant_id', user.id)
            .maybeSingle();

          if (!applicationError && applicationData) {
            setHasApplied(true);
          }
        }

        if (data?.required_skills) {
          if (Array.isArray(data.required_skills)) {
            projectData.required_skills = data.required_skills;
          } else if (typeof data.required_skills === 'string') {
            projectData.required_skills = [data.required_skills];
          } else {
            projectData.required_skills = [];
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, user?.id, toast]);

  const handleAuthPrompt = () => {
    navigate('/auth', { state: { from: `/project/${id}` } });
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      handleAuthPrompt();
      return;
    }

    navigate(`/freelancing?projectId=${id}`);
  };

  const handleWhatsAppApply = () => {
    if (!isAuthenticated) {
      handleAuthPrompt();
      return;
    }

    if (!project?.author?.whatsapp_number) return;

    const message = encodeURIComponent(
      `Hi, I'm interested in your project "${project.title}". I found it on the freelancing platform.`
    );

    window.open(
      `https://wa.me/${project.author.whatsapp_number}?text=${message}`,
      '_blank'
    );
  };

  const handleExternalApply = () => {
    if (!isAuthenticated) {
      handleAuthPrompt();
      return;
    }

    if (!project?.application_link) return;
    window.open(project.application_link, '_blank');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      description: "Link copied to clipboard",
    });
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "₹Not specified";
    if (min && !max) return `₹${min.toLocaleString('en-IN')}+`;
    if (!min && max) return `Up to ₹${max.toLocaleString('en-IN')}`;
    return `₹${min?.toLocaleString('en-IN')} - ₹${max?.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <p className="text-gray-600 mb-8">The project you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  const renderRequiredSkills = () => {
    if (!project?.required_skills) return null;

    // Check if required_skills is an array
    if (Array.isArray(project.required_skills)) {
      return project.required_skills.map((skill, index) => (
        <span
          key={index}
          className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs"
        >
          {skill}
        </span>
      ));
    }
    // Check if required_skills is a string and ensure it's not empty
    else if (typeof project.required_skills === 'string') {
      const skillsText = project.required_skills as string;
      if (skillsText.trim() === '') return null;

      return skillsText.split(',').map((skill, index) => (
        <span
          key={index}
          className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs"
        >
          {skill.trim()}
        </span>
      ));
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add SEO component for better link sharing */}
      <SEO
        title={project.title}
        description={project.description}
        companyName={project.author?.full_name || project.author?.username || "Company"}
        salary={formatBudget(project.min_budget, project.max_budget)}
        isJob={true}
        ogType="article"
        ogUrl={window.location.href}
      />

      <div className="max-w-3xl mx-auto">
        {!isAuthenticated && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6 text-center">
            <p className="text-purple-800 mb-2">Sign in to apply for this project</p>
            <Button onClick={handleAuthPrompt} variant="outline" className="bg-white text-purple-800">
              Sign In / Sign Up
            </Button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyLink}
                className="h-8 w-8"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">
                Posted by: {project.author?.full_name || project.author?.username}
              </span>
            </div>

            <p className="text-gray-700 whitespace-pre-line">{project.description}</p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Deadline: {project.application_deadline ? format(new Date(project.application_deadline), 'PP') :
                            project.deadline ? format(new Date(project.deadline), 'PP') : 'No deadline'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <IndianRupee className="w-4 h-4" />
                <span className="text-sm">
                  Budget: {formatBudget(project.min_budget, project.max_budget)}
                </span>
              </div>
            </div>

            {project.required_skills && (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Required Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {renderRequiredSkills()}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            {project.status === "open" && (
              <>
                {/* Inbuilt application method */}
                {(project.application_methods?.includes('inbuilt') ||
                  project.application_method === 'inbuilt' ||
                  project.allow_normal_apply !== false) && (
                  <Button
                    onClick={handleApply}
                    disabled={hasApplied}
                    className={hasApplied ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {hasApplied ? "Applied" : "Apply Now"}
                  </Button>
                )}

                {/* Direct application method */}
                {(project.application_methods?.includes('direct') ||
                  project.application_method === 'direct') &&
                  project.application_link && (
                  <Button
                    variant="outline"
                    onClick={handleExternalApply}
                    className="gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Apply Externally
                  </Button>
                )}

                {/* WhatsApp application method */}
                {(project.application_methods?.includes('whatsapp') ||
                  project.application_method === 'whatsapp' ||
                  (project.allow_whatsapp_apply && project.author?.whatsapp_number)) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={handleWhatsAppApply}
                          className="gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="#25D366"
                            stroke="none"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Apply via WhatsApp
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Contact directly via WhatsApp</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}

            {project.status === "closed" && (
              <div className="text-red-500 font-medium">This project is closed</div>
            )}

            {project.status === "in_progress" && (
              <div className="text-blue-500 font-medium">This project is in progress</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProject;
