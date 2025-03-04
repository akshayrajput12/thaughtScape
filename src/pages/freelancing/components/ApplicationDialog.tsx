
// Same for application dialog

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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Project {
  id: string;
  title: string;
  author_id: string;
}

interface ApplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSubmitSuccess: () => void;
}

export const ApplicationDialog: React.FC<ApplicationDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess,
}) => {
  const [message, setMessage] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setMessage("");
    setExperience("");
    setPortfolio("");
    setPhoneNumber("");
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Missing message",
        description: "Please enter a message to the project owner",
        variant: "destructive",
      });
      return;
    }

    if (!project) return;

    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase.from("project_applications").insert({
        project_id: project.id,
        applicant_id: userData.user.id,
        message: message.trim(),
        experience: experience.trim() || null,
        portfolio: portfolio.trim() || null,
        phone_number: phoneNumber.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast({
            title: "Already applied",
            description: "You have already applied to this project",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Application submitted",
          description: "Your application has been sent successfully",
        });
        onSubmitSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Failed to submit your application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold mb-2">
            Apply for Project
          </DialogTitle>
          <DialogDescription>
            {project ? `Apply for "${project.title}"` : "Loading project..."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="message" className="font-medium">
                  Cover Letter *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Explain why you're the best candidate for this project..."
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="experience" className="font-medium">
                  Relevant Experience
                </Label>
                <Textarea
                  id="experience"
                  placeholder="Describe your relevant experience..."
                  rows={4}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="portfolio" className="font-medium">
                  Portfolio / Past Work
                </Label>
                <Input
                  id="portfolio"
                  placeholder="Links to your portfolio or past work"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="font-medium">
                  Contact Number
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="Phone number for direct contact"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
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
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
