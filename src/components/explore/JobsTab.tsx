import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, ChevronDown, Clock, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types";
import { ApplicationDialog } from "@/pages/freelancing/components/ApplicationDialog";
import JobListItem from "./JobListItem";

const JobsTab = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    experienceLevel: 'all',
    location: 'all',
    budget: 'all'
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchUserApplications();
  }, [user?.id]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
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
          ),
          applications:project_applications(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure the status is properly cast to the expected type
      if (data) {
        const typedProjects = data.map(project => ({
          ...project,
          // Keep both min_budget and max_budget for proper budget display
          min_budget: project.min_budget,
          max_budget: project.max_budget,
          // For backward compatibility
          budget: project.min_budget,
          _count: {
            applications: project.applications?.[0]?.count || 0,
            comments: 0
          },
          status: project.status as "open" | "closed" | "in_progress"
        }));

        setProjects(typedProjects as Project[]);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!user?.id) {
      setUserApplications([]);
      return;
    }

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
  };

  const handleApplyToProject = (project: Project) => {
    if (!user) {
      navigate('/auth', { state: { from: '/explore' } });
      return;
    }

    setSelectedProject(project);
    setApplicationMessage('');
    setIsApplicationDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedProject) return;

    try {
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: selectedProject.id,
          applicant_id: user.id,
          message: applicationMessage,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });

      // Update the user applications list
      setUserApplications([...userApplications, selectedProject.id]);
      setIsApplicationDialogOpen(false);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      jobType: 'all',
      experienceLevel: 'all',
      location: 'all',
      budget: 'all'
    });
    setSearchTerm('');
  };

  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      (project.required_skills &&
        project.required_skills.some(skill =>
          typeof skill === 'string' && skill.toLowerCase().includes(searchLower)
        ));

    // Other filters
    const matchesJobType = filters.jobType === 'all' || project.job_type === filters.jobType;
    const matchesExperience = filters.experienceLevel === 'all' || project.experience_level === filters.experienceLevel;
    const matchesLocation = filters.location === 'all' ||
                           (project.location && project.location.toLowerCase().includes(filters.location.toLowerCase()));

    let matchesBudget = true;
    if (filters.budget && filters.budget !== 'all') {
      const budget = parseInt(filters.budget);
      matchesBudget = (project.min_budget && project.min_budget >= budget) ||
                      (project.max_budget && project.max_budget >= budget);
    }

    return matchesSearch && matchesJobType && matchesExperience && matchesLocation && matchesBudget;
  });

  // Get unique values for filters with fallbacks to prevent empty values
  const jobTypes = [...new Set(projects.map(p => p.job_type || "").filter(v => v !== ""))];
  const experienceLevels = [...new Set(projects.map(p => p.experience_level || "").filter(v => v !== ""))];
  const locations = [...new Set(projects.map(p => p.location || "").filter(v => v !== ""))];

  // Sort projects - featured first, then by creation date
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md rounded-xl md:rounded-2xl p-4 shadow-lg border border-border"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs by title, description or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {Object.values(filters).some(v => v !== 'all') && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {Object.values(filters).filter(v => v !== 'all').length}
              </Badge>
            )}
          </Button>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {jobTypes.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Job Type</label>
                  <Select value={filters.jobType} onValueChange={(value) => setFilters({...filters, jobType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All job types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All job types</SelectItem>
                      {jobTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {experienceLevels.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Experience Level</label>
                  <Select value={filters.experienceLevel} onValueChange={(value) => setFilters({...filters, experienceLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All experience levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All experience levels</SelectItem>
                      {experienceLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {locations.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Location</label>
                  <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Minimum Budget</label>
                <Select value={filters.budget} onValueChange={(value) => setFilters({...filters, budget: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any budget</SelectItem>
                    <SelectItem value="1000">₹1,000+</SelectItem>
                    <SelectItem value="5000">₹5,000+</SelectItem>
                    <SelectItem value="10000">₹10,000+</SelectItem>
                    <SelectItem value="25000">₹25,000+</SelectItem>
                    <SelectItem value="50000">₹50,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={!Object.values(filters).some(v => v !== 'all') && !searchTerm}
              >
                Reset filters
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Results count and sort */}
      {!isLoading && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sortedProjects.length}</span> jobs
            {(searchTerm || Object.values(filters).some(v => v !== 'all')) && " with applied filters"}
          </p>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Latest first</span>
          </div>
        </div>
      )}

      {/* Projects list - vertical layout */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl shadow-sm animate-pulse p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/5 mb-4" />
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedProjects.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {sortedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card hover:bg-card/80 border border-border hover:border-primary/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <JobListItem
                project={project}
                hasApplied={userApplications.includes(project.id)}
                onApply={handleApplyToProject}
                featured={project.is_featured}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-card rounded-xl border border-border"
        >
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-foreground mb-2">No jobs found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchTerm || Object.values(filters).some(v => v !== 'all')
              ? "Try adjusting your search or filters to find more opportunities."
              : "There are no job opportunities available at the moment. Check back later!"}
          </p>
          {(searchTerm || Object.values(filters).some(v => v !== 'all')) && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Application Dialog */}
      {selectedProject && (
        <ApplicationDialog
          isOpen={isApplicationDialogOpen}
          onOpenChange={setIsApplicationDialogOpen}
          project={selectedProject}
          message={applicationMessage}
          onMessageChange={setApplicationMessage}
          onSubmit={handleSubmitApplication}
          isSubmitting={false}
        />
      )}
    </div>
  );
};

export default JobsTab;
