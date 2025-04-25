
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { ProjectNotificationBadge } from "@/components/freelancing/ProjectNotificationBadge";
import { supabase } from "@/integrations/supabase/client";

interface NotificationIconsProps {
  unreadMessages: number;
  unreadNotifications: number;
  userId: string;
}

export const NotificationIcons = ({ userId }: NotificationIconsProps) => {
  const location = useLocation();

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
        <Link to="/freelancing" className="text-gray-600 hover:text-gray-900">
          <Briefcase className="h-6 w-6" />
          <ProjectNotificationBadge userId={userId} />
        </Link>
      </div>
    </>
  );
};
