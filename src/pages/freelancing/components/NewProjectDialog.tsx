
// Use the internal scroll styling for the form

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Upload, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [allowNormalApply, setAllowNormalApply] = useState(true);
  const [allowWhatsappApply, setAllowWhatsappApply] = useState(true);
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMinBudget("");
    setMaxBudget("");
    setDeadline("");
    setAllowNormalApply(true);
    setAllowWhatsappApply(true);
    setSkill("");
    setSkills([]);
    setAttachment(null);
    setIsLoading(false);
  };

  const handleAddSkill = () => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
      setSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a project title",
        variant: "destructive",
      });
      return false;
    }

    if (!description.trim()) {
      toast({
        title: "Missing description",
        description: "Please enter a project description",
        variant: "destructive",
      });
      return false;
    }

    if (skills.length === 0) {
      toast({
        title: "Missing skills",
        description: "Please add at least one required skill",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      let attachmentUrl = null;
      if (attachment) {
        const fileExt = attachment.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${userData.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("project_attachments")
          .upload(filePath, attachment);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project_attachments")
          .getPublicUrl(filePath);

        attachmentUrl = urlData.publicUrl;
      }

      const minBudgetNum = minBudget ? parseFloat(minBudget) : null;
      const maxBudgetNum = maxBudget ? parseFloat(maxBudget) : null;

      const { error } = await supabase.from("projects").insert({
        title,
        description,
        min_budget: minBudgetNum,
        max_budget: maxBudgetNum,
        deadline: deadline || null,
        author_id: userData.user.id,
        required_skills: skills,
        attachment_url: attachmentUrl,
        allow_normal_apply: allowNormalApply,
        allow_whatsapp_apply: allowWhatsappApply,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });
      onCreated();
      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold mb-2">
            Create a New Project
          </DialogTitle>
          <DialogDescription>
            Fill in the details to post a new project.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project requirements..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="minBudget">Minimum Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                    <Input
                      id="minBudget"
                      type="number"
                      placeholder="Min"
                      className="pl-7"
                      value={minBudget}
                      onChange={(e) => setMinBudget(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="maxBudget">Maximum Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                    <Input
                      id="maxBudget"
                      type="number"
                      placeholder="Max"
                      className="pl-7"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <Label htmlFor="skills">Required Skills *</Label>
                <div className="flex gap-2">
                  <Input
                    id="skills"
                    placeholder="Add a required skill"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <Badge variant="secondary" key={s} className="px-2 py-1">
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No skills added yet
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="attachment">Attachment</Label>
                <div className="mt-1">
                  <label className="flex justify-center w-full h-32 px-4 transition border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                    <span className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="w-6 h-6 text-gray-600" />
                      <span className="font-medium text-gray-600">
                        {attachment
                          ? attachment.name
                          : "Click to upload project files"}
                      </span>
                    </span>
                    <input
                      id="attachment"
                      name="attachment"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="normalApply">Allow Direct Applications</Label>
                    <div className="text-sm text-muted-foreground">
                      Let users apply directly through the platform
                    </div>
                  </div>
                  <Switch
                    id="normalApply"
                    checked={allowNormalApply}
                    onCheckedChange={setAllowNormalApply}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsappApply">Allow WhatsApp Applications</Label>
                    <div className="text-sm text-muted-foreground">
                      Let users apply via WhatsApp
                    </div>
                  </div>
                  <Switch
                    id="whatsappApply"
                    checked={allowWhatsappApply}
                    onCheckedChange={setAllowWhatsappApply}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
