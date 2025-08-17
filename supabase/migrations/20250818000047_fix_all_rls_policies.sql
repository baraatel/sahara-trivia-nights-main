-- Migration: Fix RLS policies for all tables causing 403 errors
-- This migration fixes RLS policies for user_game_purchases, code_redemptions, and users tables

-- Fix user_game_purchases table RLS policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can make purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can manage all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can update user purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can delete user purchases" ON public.user_game_purchases;

-- Create simple, reliable policies for user_game_purchases
CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own purchases" ON public.user_game_purchases
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Admin can manage all purchases" ON public.user_game_purchases
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
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
DROP POLICY IF EXISTS "Admin can update code redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can delete code redemptions" ON public.code_redemptions;

-- Create simple, reliable policies for code_redemptions
CREATE POLICY "Users can view own redemptions" ON public.code_redemptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create redemptions" ON public.code_redemptions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own redemptions" ON public.code_redemptions
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all redemptions" ON public.code_redemptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Admin can manage all redemptions" ON public.code_redemptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Fix users table RLS policies (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- Create simple, reliable policies for users table
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Admin can manage all users" ON public.users
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
  RAISE NOTICE 'Fixed RLS policies for user_game_purchases, code_redemptions, and users tables';
  RAISE NOTICE 'All tables now have simple, reliable policies without complex function calls';
END $$;
