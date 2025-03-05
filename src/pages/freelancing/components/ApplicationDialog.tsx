
import React, { useState } from "react";
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
import { Project } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  project: Project;
  message: string;
  onMessageChange: React.Dispatch<React.SetStateAction<string>>;
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
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [experience, setExperience] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Apply for Project</DialogTitle>
          <DialogDescription>
            Send a message to the project owner explaining why you're a good fit
            for "{project?.title}".
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain why you're interested in this project..."
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea
                id="experience"
                placeholder="Describe your relevant experience for this project..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio/Past Work</Label>
              <Textarea
                id="portfolio"
                placeholder="Share links or descriptions of your past work..."
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
              />
            </div>
            
            {project?.allow_whatsapp_apply && (
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  The project owner requested WhatsApp contact.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!message.trim() || isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
