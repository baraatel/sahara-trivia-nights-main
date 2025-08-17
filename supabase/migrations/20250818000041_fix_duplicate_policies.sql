-- Migration: Fix duplicate policies and create more permissive policies
-- This migration removes duplicate policies and creates more permissive ones for testing

-- Drop all existing policies on user_stats table
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can create own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can delete own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can view all stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can manage all stats" ON public.user_stats;

-- Create simplified, more permissive policies for testing
-- Allow all authenticated users to view all stats (for debugging)
CREATE POLICY "Allow all authenticated users to view stats" ON public.user_stats
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own stats
CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (user_id = auth.uid());

-- Allow users to insert their own stats
CREATE POLICY "Users can insert own stats" ON public.user_stats
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own stats
CREATE POLICY "Users can delete own stats" ON public.user_stats
FOR DELETE USING (user_id = auth.uid());

-- Also create a policy that allows access if user_id matches or if user is admin
CREATE POLICY "Users can access own stats or admin access" ON public.user_stats
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed duplicate policies and created more permissive policies for testing';
  RAISE NOTICE 'All authenticated users can now view stats for debugging purposes';
END $$;
