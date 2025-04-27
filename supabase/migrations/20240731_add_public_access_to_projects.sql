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
