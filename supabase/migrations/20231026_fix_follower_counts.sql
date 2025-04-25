-- Create a function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations
  IF (TG_OP = 'INSERT') THEN
    -- Increment followers_count for the user being followed
    UPDATE profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;
    
    -- Increment following_count for the follower
    UPDATE profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  
  -- For DELETE operations
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement followers_count for the user being unfollowed (ensure it doesn't go below 0)
    UPDATE profiles
    SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1)
    WHERE id = OLD.following_id;
    
    -- Decrement following_count for the follower (ensure it doesn't go below 0)
    UPDATE profiles
    SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1)
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON follows;

-- Create trigger to update follower counts on follow/unfollow
CREATE TRIGGER trigger_update_follower_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- Fix any existing incorrect follower counts
-- This will update all profiles with the correct counts based on actual follows table data
UPDATE profiles p
SET followers_count = (
  SELECT COUNT(*) 
  FROM follows f 
  WHERE f.following_id = p.id
);

UPDATE profiles p
SET following_count = (
  SELECT COUNT(*) 
  FROM follows f 
  WHERE f.follower_id = p.id
);
