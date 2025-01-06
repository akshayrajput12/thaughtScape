import { Link } from "react-router-dom";
import { Bell, MessageSquare } from "lucide-react";

interface NotificationIconsProps {
  unreadMessages: number;
  unreadNotifications: number;
}

export const NotificationIcons = ({ unreadMessages, unreadNotifications }: NotificationIconsProps) => {
  return (
    <>
      <div className="relative">
        <Link to="/notifications" className="text-gray-600 hover:text-gray-900">
          <Bell className="h-6 w-6" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </Link>
      </div>
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
    </>
  );
};