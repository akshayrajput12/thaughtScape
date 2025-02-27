
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
import type { Project } from "@/types";

interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: Omit<Project, "id" | "created_at" | "updated_at" | "author">) => void;
  isSubmitting: boolean;
}

export const NewProjectDialog = ({ isOpen, onOpenChange, onSubmit, isSubmitting }: NewProjectDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Post a New Project</DialogTitle>
          <DialogDescription>
            Provide details about the project you want to create.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = String(formData.get("title"));
            const description = String(formData.get("description"));
            const skills = String(formData.get("skills"))
              .split(",")
              .map((skill) => skill.trim());
            const budget = Number(formData.get("budget"));
            const deadline = String(formData.get("deadline"));

            onSubmit({
              title,
              description,
              required_skills: skills,
              budget,
              deadline,
              status: "open",
            } as Omit<Project, "id" | "created_at" | "updated_at" | "author">);
          }}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" type="text" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="skills">Required Skills (comma-separated)</Label>
            <Input id="skills" name="skills" type="text" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input id="budget" name="budget" type="number" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" name="deadline" type="date" required />
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
