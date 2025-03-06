
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
  onSubmit: (applicationData: Partial<ProjectApplication>) => void;
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
    
    // Pass all application data to parent component
    onSubmit({
      message,
      phone_number: phoneNumber,
      experience,
      portfolio
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Apply for Project</DialogTitle>
          <DialogDescription>
            Submit your application for "{project?.title}"
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="grid gap-4 py-4 px-1">
            <div className="grid gap-2">
              <Label htmlFor="message" className="text-base font-medium">Cover Letter <span className="text-red-500">*</span></Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain why you're a good fit for this project"
                className="min-h-[150px] border-gray-300 focus:border-purple-400"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Describe your qualifications and why you're interested in this project.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone_number" className="text-base font-medium">Phone Number</Label>
              <Input 
                id="phone_number" 
                type="tel"
                placeholder="Enter your phone number"
                className="border-gray-300 focus:border-purple-400"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                The client may use this to contact you directly.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="experience" className="text-base font-medium">Relevant Experience</Label>
              <Textarea
                id="experience"
                placeholder="Describe your relevant experience for this project"
                className="min-h-[100px] border-gray-300 focus:border-purple-400"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="portfolio" className="text-base font-medium">Portfolio/Previous Work (URL)</Label>
              <Input 
                id="portfolio" 
                type="url"
                placeholder="https://your-portfolio-site.com"
                className="border-gray-300 focus:border-purple-400"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isSubmitting ? "Applying..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
