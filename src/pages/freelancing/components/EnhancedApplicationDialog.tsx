
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
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Project Application</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Submit your application for this project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-gray-100">Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why are you a good fit for this project?"
                      className="resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                  <FormLabel className="text-gray-900 dark:text-gray-100">Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your phone number"
                      {...field}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
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
                  <FormLabel className="text-gray-900 dark:text-gray-100">Experience (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your relevant experience"
                      className="resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                  <FormLabel className="text-gray-900 dark:text-gray-100">Portfolio (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Link to your portfolio"
                      {...field}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
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
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} onClick={handleApply}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
