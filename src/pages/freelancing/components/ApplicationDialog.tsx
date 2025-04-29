
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from "@/types";
import { Briefcase, FileText, Link, Phone, ExternalLink, IndianRupee, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for this job",
        variant: "destructive",
      });
      return;
    }

    onSubmit();
  };



  // Handle direct application method
  const handleDirectApply = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for this job",
        variant: "destructive",
      });
      return;
    }

    if ((project.application_methods?.includes('direct') || project.application_method === 'direct') &&
        project.application_link) {
      window.open(project.application_link, '_blank');
      onOpenChange(false);
    }
  };

  // Handle WhatsApp application method
  const handleWhatsAppApply = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for this job",
        variant: "destructive",
      });
      return;
    }

    if ((project.application_methods?.includes('whatsapp') || project.application_method === 'whatsapp') &&
        project.application_link) {
      window.open(project.application_link, '_blank');
      onOpenChange(false);
    }
  };

  // Get available application methods
  const getAvailableMethods = () => {
    if (project.application_methods && project.application_methods.length > 0) {
      return project.application_methods;
    } else if (project.application_method) {
      return [project.application_method];
    }
    return ['inbuilt'];
  };

  const availableMethods = getAvailableMethods();

  // If only one external method is available and no inbuilt, auto-redirect
  useEffect(() => {
    if (isOpen) {
      // If only direct method is available, auto-redirect
      if (availableMethods.length === 1 && availableMethods[0] === 'direct' && project.application_link) {
        handleDirectApply();
      }
      // If only whatsapp method is available, auto-redirect
      else if (availableMethods.length === 1 && availableMethods[0] === 'whatsapp' && project.application_link) {
        handleWhatsAppApply();
      }
    }
  }, [isOpen, project.application_link]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] h-[90vh] sm:h-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Apply for Project</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[calc(90vh-120px)] sm:max-h-[600px]">
          <div className="space-y-6 px-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg">{project.title}</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p className="line-clamp-2 text-gray-600">{project.description}</p>

                <div className="flex items-center gap-2 text-gray-600">
                  <IndianRupee className="w-4 h-4" />
                  <span>Budget: ₹{project.budget?.toLocaleString('en-IN') || 'Not specified'}</span>
                </div>

                {(project.application_deadline || project.deadline) && (
                  <div className="text-gray-600">
                    Deadline: {project.application_deadline
                      ? format(new Date(project.application_deadline), 'PP')
                      : project.deadline
                        ? format(new Date(project.deadline), 'PP')
                        : 'No deadline'}
                  </div>
                )}

                {project.job_poster_name && (
                  <div className="text-gray-600">
                    Posted by: {project.job_poster_name}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Application Methods Section */}
              {availableMethods.length > 1 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2">Available Application Methods</h3>
                  <div className="space-y-2">
                    {availableMethods.includes('inbuilt') && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>Apply with built-in form</span>
                      </div>
                    )}
                    {availableMethods.includes('direct') && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>Apply on external website</span>
                      </div>
                    )}
                    {availableMethods.includes('whatsapp') && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Apply via WhatsApp</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Inbuilt Application Form */}
              {availableMethods.includes('inbuilt') && (
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
                      rows={4}
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
                      rows={3}
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

                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!message || isSubmitting}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              )}

              {/* External Application Options */}
              {(availableMethods.includes('direct') || availableMethods.includes('whatsapp')) && (
                <div className="space-y-4 mt-4">
                  <h3 className="font-semibold">Other Application Options</h3>
                  <div className="flex flex-wrap gap-3">
                    {availableMethods.includes('direct') && (
                      <Button
                        onClick={handleDirectApply}
                        className="gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Apply on External Website
                      </Button>
                    )}

                    {availableMethods.includes('whatsapp') && (
                      <Button
                        onClick={handleWhatsAppApply}
                        className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Apply via WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* If no inbuilt method and only external methods */}
              {!availableMethods.includes('inbuilt') && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="mt-4"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
