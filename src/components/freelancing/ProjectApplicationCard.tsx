
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, A
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  X, 
  ExternalLink, 
  Phone,
  FileText,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import type { ProjectApplication } from "@/types";

interface ProjectApplicationCardProps {
  application: ProjectApplication & { project?: any };
  onUpdateStatus: (applicationId: string, status: "accepted" | "rejected") => void;
}

export const ProjectApplicationCard = ({
  application,
  onUpdateStatus
}: ProjectApplicationCardProps) => {
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={application.applicant?.avatar_url || ""} 
            alt={application.applicant?.username || "Applicant"}
          />
          <AvatarFallback>{getInitials(application.applicant?.username || application.applicant?.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-base">
            {application.applicant?.full_name || application.applicant?.username || "Applicant"}
          </CardTitle>
          <CardDescription className="text-xs">
            Applied {formatDate(application.created_at)}
          </CardDescription>
        </div>
        <div className="ml-auto">
          <span 
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusClass(application.status)}`}
          >
            {application.status}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Project: {application.project?.title}</h4>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{application.phone_number || "No phone provided"}</span>
          </div>
          
          <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="px-0 text-primary">
                <FileText className="h-4 w-4 mr-1" />
                View Cover Letter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Application Details</DialogTitle>
                <DialogDescription>
                  From {application.applicant?.full_name || application.applicant?.username}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Cover Letter</h4>
                  <p className="text-sm whitespace-pre-wrap">{application.message}</p>
                </div>
                
                {application.experience && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Relevant Experience</h4>
                    <p className="text-sm whitespace-pre-wrap">{application.experience}</p>
                  </div>
                )}
                
                {application.portfolio && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Portfolio/Previous Work</h4>
                    <div className="flex items-center">
                      <a 
                        href={application.portfolio.startsWith('http') ? application.portfolio : `https://${application.portfolio}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary flex items-center text-sm"
                      >
                        {application.portfolio}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Contact Information</h4>
                  <p className="text-sm">Phone: {application.phone_number || "Not provided"}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        {application.status === "pending" && (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => onUpdateStatus(application.id, "accepted")}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => onUpdateStatus(application.id, "rejected")}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
