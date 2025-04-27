# Deployment Guide for Project Card Budget Fix

This guide will help you deploy the fixes for the project card budget display and non-authenticated user access issues.

## 1. Apply the RLS Policies to Supabase

The main issue with non-authenticated users not being able to view shared project links is due to missing Row Level Security (RLS) policies. We've created a migration file that adds the necessary policies.

To apply these policies:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL code:

```sql
-- Enable Row Level Security for projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read projects
CREATE POLICY "Allow public read access to projects" 
ON public.projects
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert their own projects
CREATE POLICY "Allow authenticated users to insert their own projects" 
ON public.projects
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Create policy to allow users to update their own projects
CREATE POLICY "Allow users to update their own projects" 
ON public.projects
FOR UPDATE 
TO authenticated
USING (auth.uid() = author_id);

-- Create policy to allow users to delete their own projects
CREATE POLICY "Allow users to delete their own projects" 
ON public.projects
FOR DELETE 
TO authenticated
USING (auth.uid() = author_id);
```

4. Run the SQL query

## 2. Deploy the Code Changes

We've made several changes to fix the budget display and improve error handling for non-authenticated users:

1. Updated the SingleProject component to use `maybeSingle()` instead of `single()` to prevent 406 errors
2. Improved error handling when no project is found
3. Updated budget handling in multiple components to ensure both min_budget and max_budget are properly used

Deploy these changes to your hosting platform (Vercel, Netlify, etc.) using your normal deployment process.

## 3. Verify the Fixes

After deployment, verify that:

1. Project budgets are displayed correctly in all project cards
2. Non-authenticated users can view shared project links without errors
3. The copy link functionality works properly

If you encounter any issues, please check the browser console for error messages and review the Supabase logs for any database-related errors.
