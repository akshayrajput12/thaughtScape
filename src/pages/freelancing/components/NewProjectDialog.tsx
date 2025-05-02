import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types";
import { useMobile } from "@/hooks/use-mobile";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
  onSubmit?: (newProject: any) => void;
  isSubmitting?: boolean;
}

export const NewProjectDialog = ({
  isOpen,
  onOpenChange,
  onProjectCreated = () => {},
  onSubmit,
  isSubmitting = false
}: NewProjectDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [jobPosterName, setJobPosterName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [applicationMethods, setApplicationMethods] = useState<("direct" | "inbuilt" | "whatsapp")[]>(["inbuilt"]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const isMobile = useMobile();

  const effectiveIsSubmitting = isSubmitting || localIsSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit({
        title,
        description,
        required_skills: requiredSkills.split(',').map(skill => skill.trim()),
        min_budget: parseFloat(minBudget),
        max_budget: maxBudget ? parseFloat(maxBudget) : null,
        whatsapp_number: whatsappNumber,
        job_poster_name: isAdmin ? jobPosterName : userFullName,
        company_name: companyName,
        location,
        job_type: jobType,
        experience_level: experienceLevel,
        application_deadline: applicationDeadline || undefined,
        application_methods: applicationMethods,
        application_method: applicationMethods.length > 0 ? applicationMethods[0] : 'inbuilt',
        application_link: applicationMethods.includes('direct') ? applicationLink :
                          applicationMethods.includes('whatsapp') ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '',
        attachment_url: attachmentUrl,
        is_featured: isFeatured,
        allow_whatsapp_apply: applicationMethods.includes('whatsapp'),
        allow_normal_apply: applicationMethods.includes('inbuilt')
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }

    if (!title || !description || !requiredSkills || !minBudget) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (applicationMethods.includes('direct') && !applicationLink) {
      toast({
        title: "Missing fields",
        description: "Please provide an external application link",
        variant: "destructive",
      });
      return;
    }

    if (applicationMethods.includes('whatsapp') && !whatsappNumber) {
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

    setLocalIsSubmitting(true);

    try {
      const skillsArray = requiredSkills.split(',').map(skill => skill.trim());

      if (whatsappNumber && whatsappNumber.trim() !== '') {
        await supabase
          .from('profiles')
          .update({ whatsapp_number: whatsappNumber.trim() })
          .eq('id', user.id);
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          required_skills: skillsArray,
          min_budget: parseFloat(minBudget),
          max_budget: maxBudget ? parseFloat(maxBudget) : null,
          author_id: user.id,
          status: 'open',
          verification_status: 'pending', // Set to pending by default
          job_poster_name: isAdmin ? jobPosterName : userFullName,
          company_name: companyName,
          location,
          job_type: jobType,
          experience_level: experienceLevel,
          application_deadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
          application_methods: applicationMethods,
          application_method: applicationMethods.length > 0 ? applicationMethods[0] : 'inbuilt',
          application_link: applicationMethods.includes('direct') ? applicationLink :
                            applicationMethods.includes('whatsapp') ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '',
          attachment_url: attachmentUrl || null,
          is_featured: isFeatured,
          allow_whatsapp_apply: applicationMethods.includes('whatsapp'),
          allow_normal_apply: applicationMethods.includes('inbuilt')
        })
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            whatsapp_number
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully and pending verification",
      });

      // Show verification alert
      setShowVerificationAlert(true);
      
      // Reset form after 5 seconds of showing the verification alert
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setRequiredSkills("");
        setMinBudget("");
        setMaxBudget("");
        setWhatsappNumber("");
        setApplicationDeadline("");
        setCompanyName("");
        setLocation("");
        setJobType("");
        setExperienceLevel("");
        setApplicationLink("");
        setAttachmentUrl("");
        setApplicationMethods(["inbuilt"]);
        setIsFeatured(false);
        
        setShowVerificationAlert(false);
        onOpenChange(false);
        
        if (data) {
          onProjectCreated(data as Project);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLocalIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('whatsapp_number, is_admin, full_name, username')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.whatsapp_number) {
            setWhatsappNumber(data.whatsapp_number);
          }
          setIsAdmin(!!data.is_admin);
          const userName = data.full_name || data.username || '';
          setUserFullName(userName);
          setJobPosterName(userName);
        }
      };

      fetchUserProfile();
    }
  }, [user, isOpen]);

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship"
  ];

  const experienceLevels = [
    "Entry Level",
    "Junior",
    "Mid-Level",
    "Senior",
    "Lead",
    "Manager",
    "Executive"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-[95%]' : 'sm:max-w-[550px]'} max-h-[85vh] overflow-y-auto dark:bg-gray-800`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-serif dark:text-white">Create New Post</DialogTitle>
        </DialogHeader>

        {showVerificationAlert ? (
          <div className="py-6">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-amber-800">
                <p className="font-medium mb-1">Your job posting is pending verification</p>
                <p className="text-sm">An admin will review your submission shortly. Once approved, your job will be visible to all users on the platform.</p>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="dark:text-gray-300">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                required
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-gray-300">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write your post content here..."
                rows={5}
                required
                className="dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="dark:text-gray-300">Skills *</Label>
              <Input
                id="skills"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="Add skills (comma separated)"
                required
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBudget" className="dark:text-gray-300">Minimum Budget (₹) *</Label>
                <Input
                  id="minBudget"
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBudget" className="dark:text-gray-300">Maximum Budget (₹)</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="e.g. 10000"
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="dark:text-gray-300">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                required
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="dark:text-gray-300">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote, Delhi, etc."
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType" className="dark:text-gray-300">Job Type</Label>
                <select
                  id="jobType"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select Job Type</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel" className="dark:text-gray-300">Experience Level</Label>
                <select
                  id="experienceLevel"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select Experience Level</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_deadline" className="dark:text-gray-300">Application Deadline *</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="dark:text-gray-300">Application Methods *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inbuilt"
                    checked={applicationMethods.includes('inbuilt')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setApplicationMethods([...applicationMethods, 'inbuilt']);
                      } else {
                        setApplicationMethods(applicationMethods.filter(method => method !== 'inbuilt'));
                      }
                    }}
                  />
                  <Label htmlFor="inbuilt" className="cursor-pointer dark:text-gray-300">Inbuilt App Apply (Web App Form)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="direct"
                    checked={applicationMethods.includes('direct')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setApplicationMethods([...applicationMethods, 'direct']);
                      } else {
                        setApplicationMethods(applicationMethods.filter(method => method !== 'direct'));
                      }
                    }}
                  />
                  <Label htmlFor="direct" className="cursor-pointer dark:text-gray-300">Direct Apply (External Link Redirect)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp"
                    checked={applicationMethods.includes('whatsapp')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setApplicationMethods([...applicationMethods, 'whatsapp']);
                      } else {
                        setApplicationMethods(applicationMethods.filter(method => method !== 'whatsapp'));
                      }
                    }}
                  />
                  <Label htmlFor="whatsapp" className="cursor-pointer dark:text-gray-300">WhatsApp Apply</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Select one or more application methods</p>
            </div>

            {applicationMethods.includes('direct') && (
              <div className="space-y-2">
                <Label htmlFor="application_link" className="dark:text-gray-300">External Application Link *</Label>
                <Input
                  id="application_link"
                  value={applicationLink}
                  onChange={(e) => setApplicationLink(e.target.value)}
                  placeholder="e.g. https://example.com/apply"
                  required={applicationMethods.includes('direct')}
                  className="dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-muted-foreground dark:text-gray-400">Link to an external application form or website</p>
              </div>
            )}

            {applicationMethods.includes('whatsapp') && (
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="dark:text-gray-300">WhatsApp Number *</Label>
                <Input
                  id="whatsapp_number"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +919876543210 (with country code)"
                  required={applicationMethods.includes('whatsapp')}
                  className="dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-muted-foreground dark:text-gray-400">This will be saved to your profile for future projects</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="attachment_url" className="dark:text-gray-300">Attachment URL</Label>
              <Input
                id="attachment_url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="e.g. https://example.com/job-details.pdf"
                className="dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-muted-foreground dark:text-gray-400">Link to additional job details or documents</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
              />
              <Label htmlFor="is_featured" className="cursor-pointer dark:text-gray-300">Mark as featured job</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={effectiveIsSubmitting}
                className="bg-gradient-to-r from-[#9b87f5] to-[#6E59A5] hover:from-[#8B5CF6] hover:to-[#7E69AB] text-white"
              >
                {effectiveIsSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
