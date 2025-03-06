
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project, ProjectApplication } from "@/types";

export interface ApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ApplicationDialog({
  isOpen,
  onOpenChange,
  project,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
}: ApplicationDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass additional fields to parent component if needed
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for Project</DialogTitle>
          <DialogDescription>
            Submit your application for "{project?.title}"
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="grid gap-4 py-4 px-1">
            <div className="grid gap-2">
              <Label htmlFor="message">Cover Letter</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain why you're a good fit for this project"
                className="min-h-[150px]"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input 
                id="phone_number" 
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea
                id="experience"
                placeholder="Describe your relevant experience for this project"
                className="min-h-[100px]"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="portfolio">Portfolio/Previous Work (URL)</Label>
              <Input 
                id="portfolio" 
                type="url"
                placeholder="https://your-portfolio-site.com"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Applying..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
