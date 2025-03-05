
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectDialog({
  isOpen,
  onOpenChange,
}: NewProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowWhatsApp, setAllowWhatsApp] = useState(false);
  const [allowNormalApply, setAllowNormalApply] = useState(true);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !deadline) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Parse budget values
    const minBudgetNum = minBudget ? parseFloat(minBudget) : undefined;
    const maxBudgetNum = maxBudget ? parseFloat(maxBudget) : undefined;

    // Parse skills into array
    const skillsArray = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    if (skillsArray.length === 0) {
      toast({
        title: "Required Fields Missing",
        description: "Please add at least one required skill.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to post a project.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("projects").insert({
        title,
        description,
        required_skills: skillsArray,
        min_budget: minBudgetNum,
        max_budget: maxBudgetNum,
        deadline: deadline?.toISOString(),
        status: "open",
        author_id: session.session.user.id,
        allow_whatsapp_apply: allowWhatsApp,
        allow_normal_apply: allowNormalApply,
      });

      if (error) throw error;

      toast({
        title: "Project Posted",
        description: "Your project has been posted successfully!",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setSkills("");
      setMinBudget("");
      setMaxBudget("");
      setDeadline(undefined);
      setAllowWhatsApp(false);
      setAllowNormalApply(true);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Post a New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to post your project for freelancers.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-right">
                Project Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear title for your project"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project requirements, goals, and expectations"
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills" className="text-right">
                Required Skills *
              </Label>
              <Textarea
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Enter skills separated by commas (e.g., React, Node.js, UI/UX Design)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBudget" className="text-right">
                  Minimum Budget
                </Label>
                <Input
                  id="minBudget"
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="Min budget (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBudget" className="text-right">
                  Maximum Budget
                </Label>
                <Input
                  id="maxBudget"
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="Max budget (optional)"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-right">
                Deadline *
              </Label>
              <DatePicker
                date={deadline}
                setDate={setDeadline}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp" className="cursor-pointer">
                  Allow WhatsApp applications
                </Label>
                <Switch
                  id="whatsapp"
                  checked={allowWhatsApp}
                  onCheckedChange={setAllowWhatsApp}
                />
              </div>
              <p className="text-sm text-gray-500">
                Enable this to allow applicants to share their WhatsApp number.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="normal-apply" className="cursor-pointer">
                  Allow direct applications
                </Label>
                <Switch
                  id="normal-apply"
                  checked={allowNormalApply}
                  onCheckedChange={setAllowNormalApply}
                />
              </div>
              <p className="text-sm text-gray-500">
                Enable this to allow direct platform applications.
              </p>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
              </>
            ) : (
              "Post Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
