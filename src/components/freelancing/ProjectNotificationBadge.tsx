
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const ProjectNotificationBadge = ({ userId }: { userId: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["projectNotifications", userId],
    queryFn: async () => {
      const [applicationsResponse, projectsResponse] = await Promise.all([
        supabase
          .from("project_applications")
          .select("id")
          .is("viewed_at", null)
          .eq("project_id", supabase.from("projects").select("id").eq("author_id", userId)),
        supabase
          .from("projects")
          .select("id")
          .eq("status", "open")
          .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        unviewedApplications: applicationsResponse.data?.length || 0,
        newProjects: projectsResponse.data?.length || 0
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const totalNotifications = (data?.unviewedApplications || 0) + (data?.newProjects || 0);

  if (!totalNotifications) return null;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsDialogOpen(true)}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalNotifications}
          </span>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freelancing Notifications</DialogTitle>
            <DialogDescription>
              You have new updates in the freelancing section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {data?.unviewedApplications > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  You have {data.unviewedApplications} new application{data.unviewedApplications > 1 ? 's' : ''}!
                </p>
                <Button
                  variant="link"
                  className="p-0 mt-2"
                  onClick={() => {
                    navigate("/freelancing");
                    setIsDialogOpen(false);
                  }}
                >
                  Review applications →
                </Button>
              </div>
            )}
            {data?.newProjects > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  {data.newProjects} new project{data.newProjects > 1 ? 's' : ''} posted in the last 24 hours!
                </p>
                <Button
                  variant="link"
                  className="p-0 mt-2"
                  onClick={() => {
                    navigate("/freelancing");
                    setIsDialogOpen(false);
                  }}
                >
                  Browse projects →
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
