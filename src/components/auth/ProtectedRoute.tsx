
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useProfile } from "@/contexts/ProfileContext";
import { safeLog, maskId } from "@/utils/sanitizeData";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Show loading state while auth or profile is loading
  if (authLoading || profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated || !session) {
    // Save the location the user was trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if profile is completed
  if (profile &&
      !profile.is_profile_completed &&
      !window.location.pathname.includes('/profile') &&
      session?.user?.id) {
    safeLog("Redirecting to profile completion page", {
      userId: maskId(session.user.id),
      profileComplete: false
    });
    return <Navigate to={`/profile/${session.user.id}`} replace />;
  }

  return <>{children}</>;
};
