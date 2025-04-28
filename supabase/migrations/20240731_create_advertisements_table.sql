-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  main_image_index INTEGER DEFAULT 0,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  display_location TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT
);

-- Enable Row Level Security
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read advertisements
CREATE POLICY "Allow public read access to advertisements"
ON public.advertisements
FOR SELECT
USING (true);

-- Create policy to allow only admins to insert advertisements
CREATE POLICY "Allow admins to insert advertisements"
ON public.advertisements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create policy to allow only admins to update advertisements
CREATE POLICY "Allow admins to update advertisements"
ON public.advertisements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create policy to allow only admins to delete advertisements
CREATE POLICY "Allow admins to delete advertisements"
ON public.advertisements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS advertisements_author_id_idx ON public.advertisements(author_id);
CREATE INDEX IF NOT EXISTS advertisements_is_active_idx ON public.advertisements(is_active);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_advertisements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION update_advertisements_updated_at();

-- Create storage bucket for advertisement images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('advertisement-images', 'advertisement-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Set up storage policy to allow authenticated users to upload images
DO $$
BEGIN
  INSERT INTO storage.policies (name, definition, bucket_id)
  VALUES (
    'Advertisement Images Policy',
    '(bucket_id = ''advertisement-images''::text) AND (auth.role() = ''authenticated''::text) AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)',
    'advertisement-images'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;
END $$;
