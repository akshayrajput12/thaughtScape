import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session and profile...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session error:", sessionError);
          setLoading(false);
          return;
        }

        setSession(session);

        if (session?.user) {
          console.log("Found session, fetching profile for user:", session.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Profile error:", profileError);
            setLoading(false);
            return;
          }
          
          if (profileData) {
            console.log("Profile data:", profileData);
            setProfile({
              ...profileData,
              is_profile_completed: profileData.is_profile_completed || false
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error:", error);
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileData) {
          setProfile({
            ...profileData,
            is_profile_completed: profileData.is_profile_completed || false
          });
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
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