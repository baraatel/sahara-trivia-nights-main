-- Migration: Fix get_user_stats function to include questions_answered field
-- This migration updates the get_user_stats function to include all necessary fields

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_stats(UUID);

-- Create the updated get_user_stats function to include questions_answered
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  games_played INTEGER,
  total_score INTEGER,
  questions_answered INTEGER,
  correct_answers INTEGER,
  wrong_answers INTEGER,
  accuracy_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    COALESCE(us.games_played, 0) as games_played,
    COALESCE(us.total_score, 0) as total_score,
    COALESCE(us.questions_answered, 0) as questions_answered,
    COALESCE(us.correct_answers, 0) as correct_answers,
    COALESCE(us.wrong_answers, 0) as wrong_answers,
    CASE 
      WHEN COALESCE(us.questions_answered, 0) > 0 
      THEN ROUND((COALESCE(us.correct_answers, 0)::NUMERIC / COALESCE(us.questions_answered, 0)::NUMERIC) * 100, 2)
      ELSE 0 
    END as accuracy_percentage
  FROM public.user_stats us
  WHERE us.user_id = user_uuid;
END;
$$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Updated get_user_stats function to include questions_answered field';
  RAISE NOTICE 'Function now returns all necessary fields for the frontend';
END $$;
