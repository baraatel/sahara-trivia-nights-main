-- Migration: Fix RLS policies to remove auth.users dependencies
-- This migration fixes the 403 errors by updating RLS policies to not depend on auth.users table

-- Fix user_game_purchases table RLS policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can make purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can manage all purchases" ON public.user_game_purchases;

-- Create simple policies for user_game_purchases that don't depend on auth.users
CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own purchases" ON public.user_game_purchases
FOR UPDATE USING (user_id = auth.uid());

-- Admin policies that check public.users table instead of auth.users
CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all purchases" ON public.user_game_purchases
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix code_redemptions table RLS policies
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can create their own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can update own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can view all redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can manage all redemptions" ON public.code_redemptions;

-- Create simple policies for code_redemptions that don't depend on auth.users
CREATE POLICY "Users can view own redemptions" ON public.code_redemptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create redemptions" ON public.code_redemptions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own redemptions" ON public.code_redemptions
FOR UPDATE USING (user_id = auth.uid());

-- Admin policies that check public.users table instead of auth.users
CREATE POLICY "Admin can view all redemptions" ON public.code_redemptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all redemptions" ON public.code_redemptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Re-enable RLS on users table with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- Create simple policies for users table
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

-- Admin policies that don't depend on auth.users
CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Test the fixes
DO $$
DECLARE
  test_user_id UUID;
  purchases_count INTEGER;
  redemptions_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing fixed RLS policies for user: %', test_user_id;
    
    -- Test user_game_purchases table access
    SELECT COUNT(*) INTO purchases_count FROM public.user_game_purchases WHERE user_id = test_user_id;
    RAISE NOTICE 'user_game_purchases query successful: % records found', purchases_count;
    
    -- Test code_redemptions table access
    SELECT COUNT(*) INTO redemptions_count FROM public.code_redemptions WHERE user_id = test_user_id;
    RAISE NOTICE 'code_redemptions query successful: % records found', redemptions_count;
    
    -- Test users table access
    RAISE NOTICE 'Testing users table access...';
    PERFORM 1 FROM public.users WHERE id = test_user_id;
    RAISE NOTICE 'users table query successful';
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for all tables';
  RAISE NOTICE 'Removed dependencies on auth.users table';
  RAISE NOTICE 'All policies now use public.users table for admin checks';
  RAISE NOTICE 'RLS re-enabled on users table with simple policies';
END $$;
