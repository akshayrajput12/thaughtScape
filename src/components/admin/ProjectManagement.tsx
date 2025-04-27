
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Trash } from "lucide-react";
import { format } from "date-fns";
import { type Project } from '@/types';

interface ProjectManagementProps {
  projects: Project[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProjectManagement({ projects, isLoading, onRefresh }: ProjectManagementProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New project form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobPosterName, setJobPosterName] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [location, setLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [applicationMethods, setApplicationMethods] = useState<('direct' | 'inbuilt' | 'whatsapp')[]>(['inbuilt']);
  const [applicationLink, setApplicationLink] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate application methods specific fields
    if (applicationMethods.includes('direct') && !applicationLink) {
      toast({
        title: "Missing fields",
        description: "Please provide an external application link",
        variant: "destructive",
      });
      return;
    }

    if (applicationMethods.includes('whatsapp') && !applicationLink) {
      toast({
        title: "Missing fields",
        description: "Please provide a WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    if (applicationMethods.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please select at least one application method",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse skills into array
      const skillsArray = requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          min_budget: minBudget ? parseFloat(minBudget) : null,
          max_budget: maxBudget ? parseFloat(maxBudget) : null,
          deadline: deadline || null,
          required_skills: skillsArray,
          author_id: user?.id,
          status: 'open',
          job_poster_name: jobPosterName || null,
          company_name: companyName || null,
          location: location || null,
          application_methods: applicationMethods,
          application_method: applicationMethods.length > 0 ? applicationMethods[0] : 'inbuilt',
          application_link: applicationMethods.includes('direct') ? applicationLink :
                            applicationMethods.includes('whatsapp') ? `https://wa.me/${applicationLink.replace(/\D/g, '')}` : '',
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setIsOpen(false);
      onRefresh();

      // Reset form
      setTitle('');
      setDescription('');
      setJobPosterName('');
      setMinBudget('');
      setMaxBudget('');
      setDeadline('');
      setRequiredSkills('');
      setLocation('');
      setCompanyName('');
      setApplicationMethods(['inbuilt']);
      setApplicationLink('');

    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      onRefresh();

    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects Management</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Fill out the form to create a new project
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProject} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobPosterName">Job Poster Name</Label>
                <Input
                  id="jobPosterName"
                  value={jobPosterName}
                  onChange={(e) => setJobPosterName(e.target.value)}
                  placeholder="Name of person/company posting the job"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed project description"
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBudget">Minimum Budget (₹)</Label>
                  <Input
                    id="minBudget"
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBudget">Maximum Budget (₹)</Label>
                  <Input
                    id="maxBudget"
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote, New Delhi, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
                <Input
                  id="requiredSkills"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>

              <div className="space-y-4">
                <Label>Application Methods *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="admin-inbuilt"
                      checked={applicationMethods.includes('inbuilt')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApplicationMethods([...applicationMethods, 'inbuilt']);
                        } else {
                          setApplicationMethods(applicationMethods.filter(method => method !== 'inbuilt'));
                        }
                      }}
                    />
                    <Label htmlFor="admin-inbuilt" className="cursor-pointer">Inbuilt App Apply (Web App Form)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="admin-direct"
                      checked={applicationMethods.includes('direct')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApplicationMethods([...applicationMethods, 'direct']);
                        } else {
                          setApplicationMethods(applicationMethods.filter(method => method !== 'direct'));
                        }
                      }}
                    />
                    <Label htmlFor="admin-direct" className="cursor-pointer">Direct Apply (External Link Redirect)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="admin-whatsapp"
                      checked={applicationMethods.includes('whatsapp')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApplicationMethods([...applicationMethods, 'whatsapp']);
                        } else {
                          setApplicationMethods(applicationMethods.filter(method => method !== 'whatsapp'));
                        }
                      }}
                    />
                    <Label htmlFor="admin-whatsapp" className="cursor-pointer">WhatsApp Apply</Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Select one or more application methods</p>
              </div>

              {applicationMethods.includes('direct') && (
                <div className="space-y-2">
                  <Label htmlFor="applicationLink">External Application Link *</Label>
                  <Input
                    id="applicationLink"
                    value={applicationLink}
                    onChange={(e) => setApplicationLink(e.target.value)}
                    placeholder="e.g. https://example.com/apply"
                    required={applicationMethods.includes('direct')}
                  />
                </div>
              )}

              {applicationMethods.includes('whatsapp') && (
                <div className="space-y-2">
                  <Label htmlFor="applicationLink">WhatsApp Number *</Label>
                  <Input
                    id="applicationLink"
                    value={applicationLink}
                    onChange={(e) => setApplicationLink(e.target.value)}
                    placeholder="e.g. +919876543210 (with country code)"
                    required={applicationMethods.includes('whatsapp')}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <div className="bg-muted/50 p-4 border-b">
          <div className="grid grid-cols-6 font-medium text-sm">
            <div className="col-span-2">Project</div>
            <div className="hidden md:block">Budget</div>
            <div className="hidden lg:block">Date</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>
        </div>

        <div className="divide-y">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No projects found</div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="p-4 grid grid-cols-6 items-center text-sm">
                <div className="col-span-2 truncate">
                  <div className="font-medium">{project.title}</div>
                  <div className="text-muted-foreground text-xs truncate">
                    {project.company_name || project.author?.username}
                  </div>
                </div>

                <div className="hidden md:block">
                  {project.min_budget ? `₹${project.min_budget.toLocaleString()}` : 'N/A'}
                  {project.max_budget && ` - ₹${project.max_budget.toLocaleString()}`}
                </div>

                <div className="hidden lg:block text-xs text-muted-foreground">
                  {project.created_at && format(new Date(project.created_at), 'MMM d, yyyy')}
                </div>

                <div className="text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    project.status === 'open'
                      ? 'bg-emerald-100 text-emerald-800'
                      : project.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
