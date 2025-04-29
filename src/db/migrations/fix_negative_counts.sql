-- Create a function to ensure counts are never negative
CREATE OR REPLACE FUNCTION ensure_non_negative_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure followers_count is never negative
  IF NEW.followers_count < 0 THEN
    NEW.followers_count := 0;
  END IF;
  
  -- Ensure following_count is never negative
  IF NEW.following_count < 0 THEN
    NEW.following_count := 0;
  END IF;
  
  -- Ensure posts_count is never negative
  IF NEW.posts_count < 0 THEN
    NEW.posts_count := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to apply the function before any update to the profiles table
DROP TRIGGER IF EXISTS ensure_non_negative_counts_trigger ON profiles;
CREATE TRIGGER ensure_non_negative_counts_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_non_negative_counts();

-- Update any existing negative counts to zero
UPDATE profiles
SET 
  followers_count = 0 
WHERE 
  followers_count < 0;

UPDATE profiles
SET 
  following_count = 0 
WHERE 
  following_count < 0;

UPDATE profiles
SET 
  posts_count = 0 
WHERE 
  posts_count < 0;
