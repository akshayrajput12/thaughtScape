
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";

export interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (newProject: any) => void;
}

export function NewProjectDialog({ 
  isOpen, 
  onOpenChange, 
  isSubmitting, 
  onSubmit 
}: NewProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [allowNormalApply, setAllowNormalApply] = useState(true);
  const [category, setCategory] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allowWhatsappApply && !allowNormalApply) {
      return; // Handle validation error
    }

    onSubmit({
      title,
      description,
      required_skills: skills.split(",").map(skill => skill.trim()),
      budget: Number(budget),
      deadline: deadline?.toISOString().split("T")[0],
      whatsapp_number: whatsappNumber,
      allow_whatsapp_apply: allowWhatsappApply,
      allow_normal_apply: allowNormalApply,
      project_category: category,
      experience_level: experienceLevel
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a New Project</DialogTitle>
          <DialogDescription>
            Provide details about the project you want to create.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="grid gap-4 py-4 px-1">
            <div className="grid gap-2">
              <Label htmlFor="title">Project Title</Label>
              <Input 
                id="title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear, descriptive title for your project" 
                required 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project requirements, goals, and any specific instructions"
                className="min-h-[150px]"
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="project_category">Project Category</Label>
                <select
                  id="project_category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>Select category</option>
                  <option value="web_development">Web Development</option>
                  <option value="mobile_app">Mobile App Development</option>
                  <option value="design">Design</option>
                  <option value="writing">Content Writing</option>
                  <option value="marketing">Digital Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="experience_level">Required Experience Level</Label>
                <select
                  id="experience_level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>Select level</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="skills">Required Skills (comma-separated)</Label>
              <Input 
                id="skills" 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g., React, Node.js, TypeScript" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input 
                  id="budget" 
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter project budget" 
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <DatePicker
                  date={deadline}
                  setDate={setDeadline}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input 
                id="whatsapp_number" 
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                type="tel"
                placeholder="Enter your WhatsApp number (e.g., +919876543210)" 
              />
              <p className="text-xs text-gray-500">Format: Country code followed by number without spaces</p>
            </div>
            
            <div className="space-y-4 pt-2">
              <Label>Application Methods</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allow_normal_apply" 
                    checked={allowNormalApply}
                    onCheckedChange={(checked) => {
                      setAllowNormalApply(checked as boolean);
                    }}
                  />
                  <label
                    htmlFor="allow_normal_apply"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Allow normal application through platform
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allow_whatsapp_apply" 
                    checked={allowWhatsappApply}
                    onCheckedChange={(checked) => {
                      setAllowWhatsappApply(checked as boolean);
                    }}
                  />
                  <label
                    htmlFor="allow_whatsapp_apply"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Allow applications through WhatsApp
                  </label>
                </div>
              </div>
              {!allowNormalApply && !allowWhatsappApply && (
                <p className="text-xs text-red-500">At least one application method must be selected</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || (!allowNormalApply && !allowWhatsappApply)}
              >
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
