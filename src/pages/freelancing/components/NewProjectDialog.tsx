
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

export interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newProject: any) => void;
  isSubmitting: boolean;
}

export const NewProjectDialog = ({ isOpen, onOpenChange, onSubmit, isSubmitting }: NewProjectDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minBudget, setMinBudget] = useState<number | undefined>(undefined);
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
  const [deadline, setDeadline] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [allowNormalApply, setAllowNormalApply] = useState(true);
  const { toast } = useToast();

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || skills.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if ((minBudget !== undefined && maxBudget !== undefined) && minBudget > maxBudget) {
      toast({
        title: "Invalid budget range",
        description: "Minimum budget cannot be greater than maximum budget",
        variant: "destructive",
      });
      return;
    }

    const newProject = {
      title,
      description,
      min_budget: minBudget,
      max_budget: maxBudget,
      deadline: deadline || null,
      required_skills: skills,
      allow_whatsapp_apply: allowWhatsappApply,
      allow_normal_apply: allowNormalApply
    };
    
    try {
      onSubmit(newProject);
      
      // Reset form on successful submission
      setTitle("");
      setDescription("");
      setMinBudget(undefined);
      setMaxBudget(undefined);
      setDeadline("");
      setSkills([]);
      setSkillInput("");
      setAllowWhatsappApply(true);
      setAllowNormalApply(true);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Post a new project for freelancers to apply.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[70vh] pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a concise project title"
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBudget">Minimum Budget</Label>
                <Input
                  id="minBudget"
                  type="number"
                  value={minBudget || ''}
                  onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxBudget">Maximum Budget</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  value={maxBudget || ''}
                  onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1000"
                />
              </div>
            </div>
            
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
              <Label htmlFor="skills">Required Skills *</Label>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Enter a skill and press Add"
                />
                <Button type="button" onClick={handleAddSkill}>Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Application Methods</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="allowWhatsappApply" className="cursor-pointer">
                  Allow WhatsApp applications
                </Label>
                <Switch
                  id="allowWhatsappApply"
                  checked={allowWhatsappApply}
                  onCheckedChange={setAllowWhatsappApply}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="allowNormalApply" className="cursor-pointer">
                  Allow in-app applications
                </Label>
                <Switch
                  id="allowNormalApply"
                  checked={allowNormalApply}
                  onCheckedChange={setAllowNormalApply}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
