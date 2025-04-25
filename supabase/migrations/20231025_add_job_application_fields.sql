-- Add application_link column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS application_link TEXT;

-- Add is_featured column to projects table with default value of false
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add expected_salary column to project_applications table
ALTER TABLE project_applications
ADD COLUMN IF NOT EXISTS expected_salary NUMERIC;
