
import { Link } from "react-router-dom";
import { MessageSquare, Briefcase } from "lucide-react";
import { ProjectNotificationBadge } from "@/components/freelancing/ProjectNotificationBadge";

interface NotificationIconsProps {
  unreadMessages: number;
  unreadNotifications: number;
  userId: string;
}

export const NotificationIcons = ({ unreadMessages, userId }: NotificationIconsProps) => {
  return (
    <>
      <div className="relative">
        <Link to="/messages" className="text-gray-600 hover:text-gray-900">
          <MessageSquare className="h-6 w-6" />
          {unreadMessages > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
        </Link>
      </div>
      <div className="relative">
        <Link to="/freelancing" className="text-gray-600 hover:text-gray-900">
          <Briefcase className="h-6 w-6" />
          <ProjectNotificationBadge userId={userId} />
        </Link>
      </div>
    </>
  );
};
