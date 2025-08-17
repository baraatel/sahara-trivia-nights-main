-- Migration: Fix user_stats table RLS policies
-- This migration simplifies the RLS policies to avoid potential issues with is_admin_user function

-- Drop all existing policies on user_stats table
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can delete own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can view all stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can manage all stats" ON public.user_stats;

-- Create simple, reliable policies for user_stats table
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

-- Admin can view all stats (using email check)
CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Admin can manage all stats (using email check)
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
  RAISE NOTICE 'Fixed user_stats table RLS policies with simpler, more reliable rules';
  RAISE NOTICE 'Users can now access their own stats and admins have full access';
END $$;
