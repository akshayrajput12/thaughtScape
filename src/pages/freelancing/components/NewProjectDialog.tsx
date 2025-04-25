
import React, { useState } from "react";
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
  const [deadline, setDeadline] = useState("");
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [allowNormalApply, setAllowNormalApply] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
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
        allow_whatsapp_apply: allowWhatsappApply,
        allow_normal_apply: allowNormalApply,
        company_name: companyName,
        location,
        job_type: jobType,
        experience_level: experienceLevel,
        deadline: deadline || undefined
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
    
    setLocalIsSubmitting(true);
    
    try {
      const skillsArray = requiredSkills.split(',').map(skill => skill.trim());
      
      // If whatsapp number is provided, update the user's profile
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
          allow_whatsapp_apply: allowWhatsappApply,
          allow_normal_apply: allowNormalApply,
          company_name: companyName,
          location,
          job_type: jobType,
          experience_level: experienceLevel,
          deadline: deadline || null
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
        description: "Project created successfully",
      });
      
      setTitle("");
      setDescription("");
      setRequiredSkills("");
      setMinBudget("");
      setMaxBudget("");
      setWhatsappNumber("");
      setDeadline("");
      setCompanyName("");
      setLocation("");
      setJobType("");
      setExperienceLevel("");
      
      onOpenChange(false);
      if (data) {
        onProjectCreated(data as Project);
      }
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
  
  // Fetch user's whatsapp number if available
  React.useEffect(() => {
    if (user && isOpen) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('whatsapp_number')
          .eq('id', user.id)
          .single();
          
        if (!error && data && data.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number);
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
      <DialogContent className={`${isMobile ? 'max-w-[95%]' : 'sm:max-w-[550px]'} max-h-[85vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Website Development"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input 
              id="companyName" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              placeholder="e.g. Tech Solutions Inc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe your project requirements in detail"
              rows={5}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills *</Label>
            <Input 
              id="skills" 
              value={requiredSkills} 
              onChange={(e) => setRequiredSkills(e.target.value)} 
              placeholder="e.g. React, Node.js, UI/UX (comma separated)"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minBudget">Minimum Budget (₹) *</Label>
              <Input 
                id="minBudget" 
                type="number" 
                value={minBudget} 
                onChange={(e) => setMinBudget(e.target.value)} 
                placeholder="e.g. 5000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxBudget">Maximum Budget (₹)</Label>
              <Input 
                id="maxBudget" 
                type="number" 
                value={maxBudget} 
                onChange={(e) => setMaxBudget(e.target.value)} 
                placeholder="e.g. 10000"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. Remote, Delhi, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <select
                id="jobType"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <select
                id="experienceLevel"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Select Experience Level</option>
                {experienceLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Project Deadline</Label>
              <Input 
                id="deadline" 
                type="date" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp Number (for direct contact)</Label>
            <Input 
              id="whatsapp_number" 
              value={whatsappNumber} 
              onChange={(e) => setWhatsappNumber(e.target.value)} 
              placeholder="e.g. +919876543210 (with country code)"
            />
            <p className="text-xs text-muted-foreground">This will be saved to your profile for future projects</p>
          </div>
          
          <div className="space-y-4">
            <Label>Application Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="allow_normal_apply" 
                checked={allowNormalApply}
                onCheckedChange={(checked) => setAllowNormalApply(checked as boolean)}
              />
              <Label htmlFor="allow_normal_apply" className="cursor-pointer">Allow normal application through platform</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="allow_whatsapp_apply" 
                checked={allowWhatsappApply}
                onCheckedChange={(checked) => setAllowWhatsappApply(checked as boolean)}
              />
              <Label htmlFor="allow_whatsapp_apply" className="cursor-pointer">Allow direct WhatsApp application</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 pb-6 md:pb-0">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={effectiveIsSubmitting}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              {effectiveIsSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
