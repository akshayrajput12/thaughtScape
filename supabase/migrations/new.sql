
-- Migration: Job Posting System Enhancements
-- This migration adds support for:
-- 1. Job poster name field (auto-filled for users, editable for admins)
-- 2. Application methods (direct, inbuilt, whatsapp)
-- 3. Deadline management with auto-deletion
-- 4. Optional social media fields in profiles

-- Make sure the projects table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
    CREATE TABLE public.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT[] DEFAULT '{}',
      min_budget NUMERIC,
      max_budget NUMERIC,
      deadline TIMESTAMP WITH TIME ZONE,
      status TEXT DEFAULT 'open',
      author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- Add job_poster_name field to projects table if it doesn't exist
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS job_poster_name TEXT;

-- Update the application_methods field to be an array of methods
-- First, create the enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_method_type') THEN
    CREATE TYPE application_method_type AS ENUM ('direct', 'inbuilt', 'whatsapp');
  END IF;
END $$;

-- Add application_methods field to projects table if it doesn't exist (as an array)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS application_methods application_method_type[] DEFAULT '{inbuilt}';

-- For backward compatibility, keep the single application_method field
-- but make it nullable since we'll primarily use the array field
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS application_method application_method_type DEFAULT 'inbuilt';

-- Add application_link field to projects table if it doesn't exist
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS application_link TEXT;

-- Make sure the profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- Make sure social media fields exist in profiles table and are optional
DO $$
BEGIN
  -- Add linkedin_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'linkedin_url') THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN linkedin_url DROP NOT NULL;
  END IF;

  -- Add twitter_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'twitter_url') THEN
    ALTER TABLE public.profiles ADD COLUMN twitter_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN twitter_url DROP NOT NULL;
  END IF;

  -- Add instagram_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'instagram_url') THEN
    ALTER TABLE public.profiles ADD COLUMN instagram_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN instagram_url DROP NOT NULL;
  END IF;

  -- Add youtube_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'youtube_url') THEN
    ALTER TABLE public.profiles ADD COLUMN youtube_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN youtube_url DROP NOT NULL;
  END IF;

  -- Add portfolio_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'portfolio_url') THEN
    ALTER TABLE public.profiles ADD COLUMN portfolio_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN portfolio_url DROP NOT NULL;
  END IF;

  -- Add snapchat_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'snapchat_url') THEN
    ALTER TABLE public.profiles ADD COLUMN snapchat_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN snapchat_url DROP NOT NULL;
  END IF;

  -- Add github_url if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'github_url') THEN
    ALTER TABLE public.profiles ADD COLUMN github_url TEXT;
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN github_url DROP NOT NULL;
  END IF;

  -- Add whatsapp_number if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'whatsapp_number') THEN
    ALTER TABLE public.profiles ADD COLUMN whatsapp_number TEXT;
  END IF;
END $$;

-- Make sure the notifications table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      related_thought_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- Create a function to check deadline dates and handle expired jobs
CREATE OR REPLACE FUNCTION public.check_project_deadlines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete projects that are more than 3 days past their deadline
  DELETE FROM public.projects
  WHERE deadline IS NOT NULL
    AND deadline < NOW() - INTERVAL '3 days';

  -- Set status to 'closed' for projects that are past their deadline
  UPDATE public.projects
  SET status = 'closed'
  WHERE status = 'open'
    AND deadline IS NOT NULL
    AND deadline < NOW();

  -- Create notifications for projects approaching deadline (1 day left)
  INSERT INTO public.notifications (user_id, type, content, related_thought_id)
  SELECT
    author_id,
    'deadline',
    'Your project "' || title || '" is expiring in 1 day. Would you like to extend the deadline?',
    id
  FROM public.projects
  WHERE deadline IS NOT NULL
    AND deadline BETWEEN NOW() AND NOW() + INTERVAL '1 day'
    AND status = 'open'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE type = 'deadline'
      AND related_thought_id = projects.id
      AND created_at > NOW() - INTERVAL '1 day'
    );
END;
$$;

-- Make sure the pgcron extension is installed
DO $$
BEGIN
  -- Check if we have permission to create extensions
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = current_user
    AND rolsuper
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  ELSE
    RAISE NOTICE 'Insufficient privileges to create pg_cron extension. Please ask your database administrator to install it.';
  END IF;
END $$;

-- Create a cron job to run the check_project_deadlines function daily
DO $$
BEGIN
  -- Check if the cron schema exists and the schedule function is available
  IF EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'cron'
  ) AND EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'cron' AND p.proname = 'schedule'
  ) THEN
    -- Schedule the job using cron.schedule
    PERFORM cron.schedule(
      'check-project-deadlines-daily',
      '0 0 * * *', -- Run at midnight every day
      'SELECT public.check_project_deadlines();'
    );
  ELSE
    -- Log a message if cron is not available
    RAISE NOTICE 'cron extension is not fully available. The check_project_deadlines function will need to be scheduled manually.';
  END IF;
END $$;
