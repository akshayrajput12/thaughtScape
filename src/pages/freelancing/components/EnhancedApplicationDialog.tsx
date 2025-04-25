import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types";
import { 
  Briefcase, 
  FileText, 
  Link as LinkIcon, 
  Phone, 
  Calendar, 
  MapPin, 
  User, 
  Building, 
  ExternalLink,
  Award,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface EnhancedApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onExternalApply?: () => void;
}

export const EnhancedApplicationDialog = ({
  isOpen,
  onOpenChange,
  project,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
  onExternalApply
}: EnhancedApplicationDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (min && !max) return `₹${min.toLocaleString()}`;
    if (!min && max) return `Up to ₹${max.toLocaleString()}`;
    return `₹${min?.toLocaleString()} - ₹${max?.toLocaleString()}`;
  };

  const handleExternalApply = () => {
    if (onExternalApply) {
      onExternalApply();
    } else if (project.application_link) {
      window.open(project.application_link, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Apply for Job</DialogTitle>
          <DialogDescription>
            Complete the application form below to apply for this position
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="application">Application Form</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/10">
                <AvatarImage src={project.author?.avatar_url || ''} alt={project.author?.username || 'Company'} />
                <AvatarFallback>{project.author?.username?.[0]?.toUpperCase() || project.company_name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                  {project.company_name && (
                    <span className="flex items-center">
                      <Building className="h-3.5 w-3.5 mr-1" />
                      {project.company_name}
                    </span>
                  )}
                  
                  {project.location && (
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {project.location}
                    </span>
                  )}
                  
                  {project.job_type && (
                    <Badge variant="outline" className="font-normal">
                      {project.job_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">{formatBudget(project.min_budget, project.max_budget)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'No deadline'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {project.experience_level && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{project.experience_level}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posted by</p>
                    <p className="font-medium">{project.author?.username || 'Anonymous'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {project.description}
              </div>
            </div>
            
            {project.required_skills && project.required_skills.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.required_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("application")}
              >
                Continue to Application
              </Button>
              
              {project.application_link && (
                <Button
                  variant="default"
                  onClick={handleExternalApply}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  Apply Externally
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="application" className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  <Label htmlFor="message">Cover Letter *</Label>
                </div>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a good fit for this position"
                  rows={5}
                  required
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-primary" />
                  <Label htmlFor="experience">Relevant Experience</Label>
                </div>
                <Textarea
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Describe your relevant experience for this position"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-primary" />
                  <Label htmlFor="portfolio">Portfolio / Previous Work</Label>
                </div>
                <Input
                  id="portfolio"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="Link to your portfolio or previous work"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                  </div>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your phone number (with country code)"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-2 text-primary" />
                    <Label htmlFor="expectedSalary">Expected Salary (₹)</Label>
                  </div>
                  <Input
                    id="expectedSalary"
                    type="number"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="Your expected salary"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("details")}
                >
                  Back to Details
                </Button>
                
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
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
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
