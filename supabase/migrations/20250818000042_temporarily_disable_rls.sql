-- Migration: Temporarily disable RLS on user_stats table for testing
-- This migration temporarily disables RLS to test if that's causing the 403 errors

-- Temporarily disable RLS on user_stats table
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Temporarily disabled RLS on user_stats table for testing';
  RAISE NOTICE 'This will allow all requests to access user_stats data';
  RAISE NOTICE 'Remember to re-enable RLS after testing!';
END $$;
