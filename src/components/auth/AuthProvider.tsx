
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get session from local storage if available
    const persistSession = async () => {
      setLoading(true);
      
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          // Only set the user if their email is confirmed
          const isEmailConfirmed = initialSession.user?.email_confirmed_at || 
                                  initialSession.user?.app_metadata?.provider !== 'email';
          
          if (isEmailConfirmed) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsAuthenticated(true);
            console.log("Session restored from storage:", initialSession.user?.id);
          } else {
            console.log("User email not confirmed, not setting as authenticated");
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
            
            // Sign out the user if their email is not confirmed
            await supabase.auth.signOut();
          }
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    persistSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        if (currentSession) {
          // Only set the user if their email is confirmed or this is a password login
          const isEmailConfirmed = currentSession.user?.email_confirmed_at || 
                                  currentSession.user?.app_metadata?.provider !== 'email' ||
                                  event === 'SIGNED_IN';
          
          if (isEmailConfirmed) {
            setSession(currentSession);
            setUser(currentSession.user);
            setIsAuthenticated(true);
          } else {
            console.log("User email not confirmed, not setting as authenticated");
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
