
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types";

export interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: Project) => void;
  onSubmit?: (newProject: any) => void;
  isSubmitting?: boolean;
}

export const NewProjectDialog = ({ 
  isOpen, 
  onOpenChange, 
  onProjectCreated,
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
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [allowNormalApply, setAllowNormalApply] = useState(true);

  const effectiveIsSubmitting = isSubmitting || localIsSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If onSubmit prop is provided, use it instead of the default implementation
    if (onSubmit) {
      onSubmit({
        title,
        description,
        required_skills: requiredSkills.split(',').map(skill => skill.trim()),
        min_budget: parseFloat(minBudget),
        max_budget: maxBudget ? parseFloat(maxBudget) : null,
        whatsapp_number: whatsappNumber,
        allow_whatsapp_apply: allowWhatsappApply,
        allow_normal_apply: allowNormalApply
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
          allow_normal_apply: allowNormalApply
        })
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      // Reset form fields
      setTitle("");
      setDescription("");
      setRequiredSkills("");
      setMinBudget("");
      setMaxBudget("");
      setWhatsappNumber("");
      
      // Close dialog and notify parent
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
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
          
          <div className="grid grid-cols-2 gap-4">
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
          
          <div className="flex justify-end space-x-3 pt-4">
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
