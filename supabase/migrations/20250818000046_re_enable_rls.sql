-- Migration: Re-enable RLS on user_stats table with proper policies
-- This migration re-enables RLS with secure policies now that we understand the issue

-- Re-enable RLS on user_stats table
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all authenticated users to view stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can delete own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can access own stats or admin access" ON public.user_stats;

-- Create secure policies
-- Users can view their own stats
CREATE POLICY "Users can view own stats" ON public.user_stats
FOR SELECT USING (user_id = auth.uid());

-- Users can update their own stats
CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats" ON public.user_stats
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own stats
CREATE POLICY "Users can delete own stats" ON public.user_stats
FOR DELETE USING (user_id = auth.uid());

-- Admin can view all stats
CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Admin can manage all stats
CREATE POLICY "Admin can manage all stats" ON public.user_stats
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Re-enabled RLS on user_stats table with secure policies';
  RAISE NOTICE 'Users can now access their own stats and admins have full access';
END $$;
