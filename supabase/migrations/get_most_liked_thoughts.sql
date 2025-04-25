-- Create a function to get the most liked thoughts
CREATE OR REPLACE FUNCTION get_most_liked_thoughts(limit_count integer DEFAULT 10)
RETURNS SETOF thoughts
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM thoughts t
  LEFT JOIN (
    SELECT thought_id, COUNT(*) as like_count
    FROM likes
    GROUP BY thought_id
  ) l ON t.id = l.thought_id
  ORDER BY COALESCE(l.like_count, 0) DESC, t.created_at DESC
  LIMIT limit_count;
END;
$$;
