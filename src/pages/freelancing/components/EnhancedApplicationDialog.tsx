
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/badge";

interface EnhancedApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const applicationSchema = z.object({
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
  phoneNumber: z.string().optional(),
  experience: z.string().optional(),
  portfolio: z.string().optional(),
});

export const EnhancedApplicationDialog = ({
  isOpen,
  onOpenChange,
  project,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
}: EnhancedApplicationDialogProps) => {
  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      message: message,
      phoneNumber: "",
      experience: "",
      portfolio: "",
    },
  });

  const handleApply = () => {
    if (form.formState.isValid) {
      onSubmit();
    } else {
      form.trigger();
    }
  };

  // Helper function to render skills safely
  const renderSkillBadges = () => {
    if (!project.required_skills) return null;
    
    if (Array.isArray(project.required_skills)) {
      return project.required_skills.map((skill, index) => (
        <Badge key={index} variant="outline" className="text-xs font-medium">
          {skill}
        </Badge>
      ));
    } 
    
    if (typeof project.required_skills === 'string') {
      const skillsText = project.required_skills as string;
      if (skillsText.trim() === '') return null;
      
      return skillsText.split(',').map((skill, index) => (
        <Badge key={index} variant="outline" className="text-xs font-medium">
          {skill.trim()}
        </Badge>
      ));
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Project Application</DialogTitle>
          <DialogDescription>
            Submit your application for this project.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1 -mr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Why are you a good fit for this project?"
                        className="resize-none"
                        value={message}
                        onChange={(e) => {
                          field.onChange(e);
                          onMessageChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your relevant experience"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Link to your portfolio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {project.required_skills && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {renderSkillBadges()}
                </div>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter className="pt-4 mt-2 border-t">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} onClick={handleApply}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
