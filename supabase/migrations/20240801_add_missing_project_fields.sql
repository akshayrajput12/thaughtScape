-- Add missing columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS job_type TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Make sure company_name and location columns exist
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Make sure min_budget and max_budget columns exist
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS min_budget NUMERIC,
ADD COLUMN IF NOT EXISTS max_budget NUMERIC;

-- Make sure job_poster_name column exists
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS job_poster_name TEXT;

-- Make sure application_link column exists
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS application_link TEXT;
