-- Migration: Ensure all users have a record in user_stats table
-- This migration creates user_stats records for users who don't have them

-- Insert user_stats records for users who don't have them
INSERT INTO public.user_stats (user_id, games_played, total_score, questions_answered, correct_answers, wrong_answers)
SELECT 
  u.id,
  0 as games_played,
  0 as total_score,
  0 as questions_answered,
  0 as correct_answers,
  0 as wrong_answers
FROM auth.users u
LEFT JOIN public.user_stats us ON u.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Log completion
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Ensured all users have user_stats records. Inserted % new records.', inserted_count;
END $$;
