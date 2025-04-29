import { Navigate } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/hooks/use-toast";
import { safeLog } from "@/utils/sanitizeData";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { profile, isLoading } = useProfile();
  const { toast } = useToast();

  // Show loading state while profile is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Check if user is admin
  if (!profile?.is_admin) {
    safeLog("Admin access denied", { hasProfile: !!profile, isAdmin: profile?.is_admin });
    toast({
      title: "Access Denied",
      description: "You don't have permission to access the admin dashboard",
      variant: "destructive",
    });
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};
