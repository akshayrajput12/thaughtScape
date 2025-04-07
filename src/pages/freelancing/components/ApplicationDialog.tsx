
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types";
import { Briefcase, FileText, Link, Phone } from "lucide-react";
import { format } from "date-fns";
import { IndianRupee } from "lucide-react";

export interface ApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ApplicationDialog = ({
  isOpen,
  onOpenChange,
  project,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting
}: ApplicationDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Apply for Project</DialogTitle>
        </DialogHeader>

        <div className="mt-4 mb-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold text-lg">{project.title}</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p className="line-clamp-2 text-gray-600">{project.description}</p>
            
            <div className="flex items-center gap-2 text-gray-600">
              <IndianRupee className="w-4 h-4" />
              <span>Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
            </div>

            {project.deadline && (
              <div className="text-gray-600">
                Deadline: {format(new Date(project.deadline), 'PP')}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2 text-blue-500" />
              <Label htmlFor="message">Cover Letter</Label>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Introduce yourself and explain why you're a good fit for this project"
              rows={5}
              required
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-purple-500" />
              <Label htmlFor="experience">Relevant Experience</Label>
            </div>
            <Textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Describe your relevant experience for this project"
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Link className="h-4 w-4 mr-2 text-green-500" />
              <Label htmlFor="portfolio">Portfolio / Previous Work</Label>
            </div>
            <Input
              id="portfolio"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="Link to your portfolio or previous work"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-red-500" />
              <Label htmlFor="phoneNumber">Phone Number</Label>
            </div>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Your phone number (with country code)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!message || isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
