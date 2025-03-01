
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const ProjectNotificationBadge = ({ userId }: { userId: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data, refetch } = useQuery({
    queryKey: ["projectNotifications", userId],
    queryFn: async () => {
      try {
        // First get projects authored by the user
        const { data: userProjects, error: projectsError } = await supabase
          .from("projects")
          .select("id")
          .eq("author_id", userId);

        if (projectsError) {
          console.error("Error fetching user projects:", projectsError);
          return { unviewedApplications: 0, newProjects: 0 };
        }

        const projectIds = userProjects?.map(p => p.id) || [];

        if (projectIds.length === 0) {
          return { unviewedApplications: 0, newProjects: 0 };
        }

        const [applicationsResponse, projectsResponse] = await Promise.all([
          supabase
            .from("project_applications")
            .select("id")
            .is("viewed_at", null)
            .in("project_id", projectIds),
          supabase
            .from("projects")
            .select("id")
            .eq("status", "open")
            .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        ]);

        if (applicationsResponse.error) {
          console.error("Error fetching applications:", applicationsResponse.error);
        }

        if (projectsResponse.error) {
          console.error("Error fetching new projects:", projectsResponse.error);
        }

        return {
          unviewedApplications: applicationsResponse.data?.length || 0,
          newProjects: projectsResponse.data?.length || 0
        };
      } catch (error) {
        console.error("Error in projectNotifications query:", error);
        return { unviewedApplications: 0, newProjects: 0 };
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Setup realtime subscription for project applications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('project_applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_applications'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  const totalNotifications = (data?.unviewedApplications || 0) + (data?.newProjects || 0);

  if (!totalNotifications) return null;

  return (
    <>
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {totalNotifications}
      </span>

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
