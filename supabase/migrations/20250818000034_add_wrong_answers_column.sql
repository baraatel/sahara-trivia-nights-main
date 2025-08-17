-- Migration: Add wrong_answers column to user_stats table
-- This migration adds the missing wrong_answers column that is referenced in the get_user_stats function

-- Add wrong_answers column to user_stats table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stats' 
    AND column_name = 'wrong_answers'
  ) THEN
    RAISE NOTICE 'Adding wrong_answers column to user_stats table';
    ALTER TABLE public.user_stats ADD COLUMN wrong_answers INTEGER DEFAULT 0;
  ELSE
    RAISE NOTICE 'wrong_answers column already exists in user_stats table';
  END IF;
END $$;

-- Update existing records to have wrong_answers calculated from questions_answered - correct_answers
UPDATE public.user_stats 
SET wrong_answers = GREATEST(0, questions_answered - correct_answers)
WHERE wrong_answers IS NULL OR wrong_answers = 0;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added wrong_answers column to user_stats table';
  RAISE NOTICE 'Updated existing records with calculated wrong_answers values';
END $$;
