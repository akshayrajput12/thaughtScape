
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectApplication } from "@/types";

interface ProjectApplicationCardProps {
  application: ProjectApplication;
  onUpdateStatus: (applicationId: string, status: "accepted" | "rejected") => void;
}

export const ProjectApplicationCard = ({ application, onUpdateStatus }: ProjectApplicationCardProps) => {
  const navigate = useNavigate();

  const handleMessageClick = () => {
    navigate(`/messages?user=${application.applicant_id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 space-y-4 border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {application.applicant?.full_name || application.applicant?.username}
          </h3>
          <p className="text-sm text-gray-600">{application.message}</p>
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
          Status: {application.status.toUpperCase()}
        </span>
        <div className="flex gap-2">
          {application.status === "pending" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdateStatus(application.id, "accepted")}
              >
                Accept
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onUpdateStatus(application.id, "rejected")}
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
