import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { safeLog, safeErrorLog, sanitizeProfileForLogging } from '@/utils/sanitizeData';

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Ensure followers_count and following_count are never negative
        const sanitizedData = {
          ...data,
          followers_count: Math.max(0, data.followers_count || 0),
          following_count: Math.max(0, data.following_count || 0),
          posts_count: Math.max(0, data.posts_count || 0),
          is_profile_completed: data.is_profile_completed || false
        };

        safeLog('Profile fetched successfully', sanitizeProfileForLogging(sanitizedData));
        setProfile(sanitizedData);
      } else {
        setProfile(null);
      }
    } catch (err) {
      safeErrorLog('Error fetching profile', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching profile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile when user changes or auth state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Set up real-time subscription for profile updates
  useEffect(() => {
    if (!user?.id) return;

    const profileSubscription = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          safeLog('Profile updated, refetching...');
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  const value = {
    profile,
    isLoading,
    error,
    refetchProfile: fetchProfile
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
