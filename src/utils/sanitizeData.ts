import type { Profile } from "@/types";
import { User, Session } from '@supabase/supabase-js';

/**
 * Checks if the current environment is development
 * @returns boolean indicating if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Safely logs messages only in development environment
 * @param message The message to log
 * @param data Optional data to log
 */
export const safeLog = (message: string, data?: any): void => {
  if (isDevelopment()) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

/**
 * Safely logs error messages only in development environment
 * @param message The error message to log
 * @param error Optional error object to log
 */
export const safeErrorLog = (message: string, error?: any): void => {
  // Always log errors, but sanitize them in production
  if (isDevelopment()) {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  } else {
    // In production, just log the error message without details
    console.error(message);
  }
};

/**
 * Masks a UUID or other identifier to show only the first and last few characters
 * @param id The identifier to mask
 * @returns A masked version of the identifier
 */
export const maskId = (id?: string): string => {
  if (!id) return '[NO_ID]';
  if (id.length <= 8) return `${id.substring(0, 2)}...`;
  return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
};

/**
 * Interface for sanitized profile data
 */
export interface SanitizedProfile {
  id?: string;
  username?: string;
  is_profile_completed?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  has_avatar?: boolean;
  has_bio?: boolean;
  has_college?: boolean;
  has_phone?: boolean;
  has_whatsapp?: boolean;
  has_registration_number?: boolean;
  has_social_links?: boolean;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Sanitizes a user profile object for safe logging by removing or masking sensitive information
 * @param profile The full user profile object
 * @returns A sanitized version of the profile safe for logging
 */
export const sanitizeProfileForLogging = (profile: Profile | null): SanitizedProfile | null => {
  if (!profile) return null;

  // Create a sanitized copy of the profile
  const sanitized: SanitizedProfile = {
    id: maskId(profile.id),
    is_profile_completed: profile.is_profile_completed,
    // Ensure counts are never negative
    followers_count: Math.max(0, profile.followers_count || 0),
    following_count: Math.max(0, profile.following_count || 0),
    posts_count: Math.max(0, profile.posts_count || 0),
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };

  // Add masked versions of identifiable fields
  if (profile.username) {
    sanitized.username = profile.username.length > 3
      ? `${profile.username.substring(0, 2)}***`
      : '***';
  }

  // Add boolean flags for sensitive fields without revealing their values
  sanitized.has_avatar = !!profile.avatar_url;
  sanitized.has_bio = !!profile.bio;
  sanitized.has_college = !!profile.college;
  sanitized.has_phone = !!profile.phone;
  sanitized.has_whatsapp = !!profile.whatsapp_number;
  sanitized.has_registration_number = !!profile.registration_number;

  // Check if user has any social media links
  sanitized.has_social_links = !!(
    profile.instagram_url ||
    profile.linkedin_url ||
    profile.twitter_url ||
    profile.snapchat_url ||
    profile.youtube_url ||
    profile.portfolio_url ||
    profile.github_url
  );

  // Include admin status as a boolean without other details
  if (profile.is_admin !== undefined) {
    sanitized.is_admin = profile.is_admin;
  }

  return sanitized;
};

/**
 * Interface for sanitized user data
 */
export interface SanitizedUser {
  id?: string;
  email_domain?: string;
  has_email_verified?: boolean;
  auth_provider?: string;
  created_at?: string;
  last_sign_in?: string;
  has_user_metadata?: boolean;
}

/**
 * Sanitizes a Supabase User object for safe logging
 * @param user The Supabase User object
 * @returns A sanitized version of the user object
 */
export const sanitizeUserForLogs = (user: User | null): SanitizedUser | null => {
  if (!user) return null;

  const sanitized: SanitizedUser = {
    id: maskId(user.id),
    has_email_verified: !!user.email_confirmed_at,
    auth_provider: user.app_metadata?.provider || 'unknown',
    created_at: user.created_at,
    last_sign_in: user.last_sign_in_at,
    has_user_metadata: Object.keys(user.user_metadata || {}).length > 0
  };

  // Only include email domain, not the actual email
  if (user.email) {
    const emailParts = user.email.split('@');
    if (emailParts.length > 1) {
      sanitized.email_domain = `***@${emailParts[1]}`;
    }
  }

  return sanitized;
};

/**
 * Interface for sanitized auth state
 */
export interface SanitizedAuthState {
  event: string;
  has_session: boolean;
  user_id?: string | null;
  provider?: string | null;
  email_confirmed?: boolean;
  session_created_at?: string | null;
}

/**
 * Sanitizes auth state change information for logging
 * @param event The auth event name
 * @param session The session object
 * @returns A sanitized version of the auth state
 */
export const sanitizeAuthStateForLogs = (
  event: string,
  session: Session | null
): SanitizedAuthState => {
  return {
    event,
    has_session: !!session,
    user_id: session?.user ? maskId(session.user.id) : null,
    provider: session?.user?.app_metadata?.provider || null,
    email_confirmed: !!session?.user?.email_confirmed_at,
    // Use user's created_at as a proxy for session creation time
    session_created_at: session?.user?.created_at || null
  };
};
