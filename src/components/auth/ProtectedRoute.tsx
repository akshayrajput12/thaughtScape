
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user, loading, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setProfileLoading(false);
          return;
        }
        
        console.log("Fetching profile for user:", user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Profile error:", profileError);
          setProfileLoading(false);
          return;
        }
        
        if (profileData) {
          console.log("Profile data:", profileData);
          
          // Auto-complete profile if name, age, and some bio information is available
          let isProfileUpdated = false;
          let profileUpdates: any = {};
          
          if (!profileData.is_profile_completed && 
              profileData.full_name && 
              profileData.age && 
              (profileData.bio || profileData.country)) {
            profileUpdates.is_profile_completed = true;
            isProfileUpdated = true;
          }
          
          if (isProfileUpdated) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update(profileUpdates)
              .eq('id', user.id);
              
            if (updateError) {
              console.error("Error updating profile completion status:", updateError);
            } else {
              // Update profile with new values
              profileData.is_profile_completed = true;
              toast({
                title: "Profile Status Updated",
                description: "Your profile is now marked as complete",
              });
            }
          }
          
          setProfile({
            ...profileData,
            is_profile_completed: profileData.is_profile_completed || false
          });
        }
        
        setProfileLoading(false);
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user, toast]);

  if (loading || profileLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated || !session) {
    // Save the location the user was trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (profile && 
      !profile.is_profile_completed && 
      !window.location.pathname.includes('/profile') && 
      session?.user?.id) {
    console.log("Redirecting to profile completion page");
    return <Navigate to={`/profile/${session.user.id}`} replace />;
  }

  return <>{children}</>;
};
