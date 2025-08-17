-- Migration: Fix user_stats table permissions that are causing 406 errors
-- This migration ensures proper access to user_stats table

-- First, let's check if the user_stats table exists and has RLS enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_stats'
  ) THEN
    RAISE NOTICE 'user_stats table exists';
    
    -- Check if RLS is enabled
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_stats' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
      RAISE NOTICE 'RLS is enabled on user_stats table';
    ELSE
      RAISE NOTICE 'RLS is disabled on user_stats table, enabling it...';
      ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
    END IF;
  ELSE
    RAISE NOTICE 'user_stats table does not exist';
  END IF;
END $$;

-- Drop all existing policies on user_stats table
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can delete own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can view all stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can manage all stats" ON public.user_stats;

-- Create comprehensive policies for user_stats table
CREATE POLICY "Users can view own stats" ON public.user_stats
FOR SELECT USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can insert own stats" ON public.user_stats
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can delete own stats" ON public.user_stats
FOR DELETE USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (
  is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can manage all stats" ON public.user_stats
FOR ALL USING (
  is_admin_user(auth.jwt() ->> 'email')
);

-- Also ensure the user_stats table has the correct structure
-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stats' 
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'Adding user_id column to user_stats table';
    ALTER TABLE public.user_stats ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ELSE
    RAISE NOTICE 'user_id column already exists in user_stats table';
  END IF;
END $$;

-- Create a function to get user stats safely
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  games_played INTEGER,
  total_score INTEGER,
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
    COALESCE(us.correct_answers, 0) as correct_answers,
    COALESCE(us.wrong_answers, 0) as wrong_answers,
    CASE 
      WHEN COALESCE(us.correct_answers, 0) + COALESCE(us.wrong_answers, 0) > 0 
      THEN ROUND((COALESCE(us.correct_answers, 0)::NUMERIC / (COALESCE(us.correct_answers, 0) + COALESCE(us.wrong_answers, 0))::NUMERIC) * 100, 2)
      ELSE 0 
    END as accuracy_percentage
  FROM public.user_stats us
  WHERE us.user_id = user_uuid;
END;
$$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed user_stats table permissions and created safe access function';
  RAISE NOTICE 'Users can now access their own stats and admins have full access';
END $$;
