
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Briefcase, Phone, MessageSquare, ExternalLink, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProjectApplication } from '@/types';

interface ProjectApplicationCardProps {
  application: ProjectApplication;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  isAuthor: boolean;
}

export const ProjectApplicationCard: React.FC<ProjectApplicationCardProps> = ({
  application,
  onUpdateStatus,
  isAuthor
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      case 'pending':
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {application.applicant?.username || application.applicant?.full_name || "Unnamed Applicant"}
              </span>
              
              <Badge 
                className={cn(
                  "ml-2 capitalize", 
                  getStatusColor(application.status || 'pending')
                )}
              >
                {application.status || "pending"}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Applied {format(new Date(application.created_at), 'PPp')}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{application.message}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {application.phone_number && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>
                  <span className="text-xs text-gray-500 mr-1">Phone:</span>
                  <span>{application.phone_number}</span>
                </span>
              </div>
            )}
            
            {application.applicant?.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span>
                  <span className="text-xs text-gray-500 mr-1">Email:</span>
                  <span>{application.applicant.email}</span>
                </span>
              </div>
            )}
          </div>
          
          {application.experience && (
            <div className="flex gap-2 items-start">
              <Briefcase className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <span className="text-xs text-gray-500 block">Experience:</span>
                <span className="text-gray-700">{application.experience}</span>
              </div>
            </div>
          )}
          
          {application.portfolio && (
            <div className="flex gap-2 items-center">
              <ExternalLink className="h-4 w-4 text-gray-500" />
              <a href={application.portfolio} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-blue-600 hover:text-blue-800 transition-colors overflow-hidden overflow-ellipsis">
                View Portfolio
              </a>
            </div>
          )}
        </div>

        {isAuthor && application.status === 'pending' && (
          <div className="mt-5 flex gap-2 flex-wrap">
            <Button 
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onUpdateStatus(application.id, 'accepted')}
            >
              Approve
            </Button>
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => onUpdateStatus(application.id, 'rejected')}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
