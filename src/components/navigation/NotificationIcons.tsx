
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Briefcase } from "lucide-react";
import { ProjectNotificationBadge } from "@/components/freelancing/ProjectNotificationBadge";
import { supabase } from "@/integrations/supabase/client";

interface NotificationIconsProps {
  unreadMessages: number;
  unreadNotifications: number;
  userId: string;
}

export const NotificationIcons = ({ unreadMessages, userId }: NotificationIconsProps) => {
  const location = useLocation();

  // Mark messages as read when user visits the messages page
  useEffect(() => {
    if (location.pathname === "/messages" && unreadMessages > 0 && userId) {
      const markMessagesAsRead = async () => {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('receiver_id', userId)
          .eq('is_read', false);
      };
      
      markMessagesAsRead();
    }
  }, [location.pathname, unreadMessages, userId]);

  // Mark project applications as viewed when user visits freelancing page
  useEffect(() => {
    if (location.pathname === "/freelancing" && userId) {
      const markApplicationsAsViewed = async () => {
        try {
          // First get projects authored by the user
          const { data: userProjects, error: projectsError } = await supabase
            .from("projects")
            .select("id")
            .eq("author_id", userId);

          if (projectsError) {
            console.error("Error fetching user projects:", projectsError);
            return;
          }

          if (userProjects && userProjects.length > 0) {
            const projectIds = userProjects.map(p => p.id);
            
            // Update viewed_at for unviewed applications
            const { error: updateError } = await supabase
              .from("project_applications")
              .update({ viewed_at: new Date().toISOString() })
              .is("viewed_at", null)
              .in("project_id", projectIds);
              
            if (updateError) {
              console.error("Error updating application viewed status:", updateError);
            }
          }
        } catch (error) {
          console.error("Error in markApplicationsAsViewed:", error);
        }
      };
      
      markApplicationsAsViewed();
    }
  }, [location.pathname, userId]);

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
