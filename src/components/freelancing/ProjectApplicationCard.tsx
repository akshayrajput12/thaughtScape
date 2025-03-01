
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Project, ProjectApplication } from "@/types";

interface ProjectApplicationCardProps {
  application: ProjectApplication & { project?: Project };
  onUpdateStatus: (applicationId: string, status: "accepted" | "rejected") => void;
}

export const ProjectApplicationCard = ({ application, onUpdateStatus }: ProjectApplicationCardProps) => {
  const navigate = useNavigate();
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleMessageClick = () => {
    navigate(`/messages?user=${application.applicant_id}`);
  };

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setIsUpdating(true);
      await onUpdateStatus(application.id, status);
      toast({
        title: `Application ${status}`,
        description: `You have ${status} the application from ${application.applicant?.full_name || application.applicant?.username}`,
      });
    } catch (error) {
      console.error(`Error ${status} application:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} the application. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {application.applicant?.full_name || application.applicant?.username}
            </h3>
            {application.project && (
              <Dialog open={showProjectDetails} onOpenChange={setShowProjectDetails}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 rounded-full"
                  >
                    <Info className="h-4 w-4 text-gray-400" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Project Details</DialogTitle>
                    <DialogDescription>
                      Information about the project this application is for.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <h4 className="font-medium text-lg">{application.project.title}</h4>
                      <p className="text-gray-600 mt-1">{application.project.description}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Budget</h5>
                        <p>₹{application.project.budget?.toLocaleString('en-IN') || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Status</h5>
                        <p className="capitalize">{application.project.status}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Required Skills</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {application.project.required_skills?.map((skill, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Deadline</h5>
                        <p>{application.project.deadline ? new Date(application.project.deadline).toLocaleDateString() : 'No deadline'}</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-sm text-gray-600">{application.message}</p>
          {application.project && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500">Applied for:</p>
              <p className="text-sm font-medium truncate">{application.project.title}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMessageClick}
          className="hover:bg-gray-100"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Status: <span className="capitalize">{application.status}</span>
        </span>
        <div className="flex gap-2">
          {application.status === "pending" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleStatusUpdate("accepted")}
                disabled={isUpdating}
              >
                Accept
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleStatusUpdate("rejected")}
                disabled={isUpdating}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
