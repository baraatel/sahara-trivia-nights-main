-- Migration: Fix infinite recursion in RLS policies
-- This migration fixes the infinite recursion issue by using a function-based approach for admin checks

-- First, create a function to check admin status without causing recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user is an admin by looking at their email
  -- This avoids the recursion issue by not querying the users table directly
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- Create simple policies for users table that don't cause recursion
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

-- Admin policies using the function instead of direct table queries
CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all users" ON public.users
FOR ALL USING (public.is_admin_user());

-- Fix user_cart table RLS policies
DROP POLICY IF EXISTS "Users can view own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Users can update own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Admin can view all carts" ON public.user_cart;
DROP POLICY IF EXISTS "Admin can manage all carts" ON public.user_cart;

CREATE POLICY "Users can view own cart" ON public.user_cart
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own cart" ON public.user_cart
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all carts" ON public.user_cart
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all carts" ON public.user_cart
FOR ALL USING (public.is_admin_user());

-- Fix user_game_purchases table RLS policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can make purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can manage all purchases" ON public.user_game_purchases;

CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own purchases" ON public.user_game_purchases
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all purchases" ON public.user_game_purchases
FOR ALL USING (public.is_admin_user());

-- Fix code_redemptions table RLS policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can update own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can view all redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can manage all redemptions" ON public.code_redemptions;

CREATE POLICY "Users can view own redemptions" ON public.code_redemptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create redemptions" ON public.code_redemptions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own redemptions" ON public.code_redemptions
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all redemptions" ON public.code_redemptions
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all redemptions" ON public.code_redemptions
FOR ALL USING (public.is_admin_user());

-- Fix user_stats table RLS policies
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can view all stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can manage all stats" ON public.user_stats;

CREATE POLICY "Users can view own stats" ON public.user_stats
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all stats" ON public.user_stats
FOR ALL USING (public.is_admin_user());

-- Fix user_category_access table RLS policies
DROP POLICY IF EXISTS "Users can view own access" ON public.user_category_access;
DROP POLICY IF EXISTS "Users can update own access" ON public.user_category_access;
DROP POLICY IF EXISTS "Admin can view all access" ON public.user_category_access;
DROP POLICY IF EXISTS "Admin can manage all access" ON public.user_category_access;

CREATE POLICY "Users can view own access" ON public.user_category_access
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own access" ON public.user_category_access
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all access" ON public.user_category_access
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all access" ON public.user_category_access
FOR ALL USING (public.is_admin_user());

-- Fix game_purchases table RLS policies (if table exists)
DROP POLICY IF EXISTS "Users can view own game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Users can create game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Users can update own game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Admin can view all game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Admin can manage all game purchases" ON public.game_purchases;

CREATE POLICY "Users can view own game purchases" ON public.game_purchases
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create game purchases" ON public.game_purchases
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own game purchases" ON public.game_purchases
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all game purchases" ON public.game_purchases
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all game purchases" ON public.game_purchases
FOR ALL USING (public.is_admin_user());

-- Fix redemption_codes table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admin can manage all redemption codes" ON public.redemption_codes;

CREATE POLICY "Admin can view all redemption codes" ON public.redemption_codes
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all redemption codes" ON public.redemption_codes
FOR ALL USING (public.is_admin_user());

-- Fix categories table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage all categories" ON public.categories;

CREATE POLICY "Admin can view all categories" ON public.categories
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all categories" ON public.categories
FOR ALL USING (public.is_admin_user());

-- Fix questions table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all questions" ON public.questions;
DROP POLICY IF EXISTS "Admin can manage all questions" ON public.questions;

CREATE POLICY "Admin can view all questions" ON public.questions
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all questions" ON public.questions
FOR ALL USING (public.is_admin_user());

-- Fix game_packages table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all game packages" ON public.game_packages;
DROP POLICY IF EXISTS "Admin can manage all game packages" ON public.game_packages;

CREATE POLICY "Admin can view all game packages" ON public.game_packages
FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admin can manage all game packages" ON public.game_packages
FOR ALL USING (public.is_admin_user());

-- Test the fixes
DO $$
DECLARE
  test_user_id UUID;
  users_count INTEGER;
  cart_count INTEGER;
  purchases_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing fixed RLS policies for user: %', test_user_id;
    
    -- Test users table access (this should not cause recursion)
    BEGIN
      SELECT COUNT(*) INTO users_count FROM public.users WHERE id = test_user_id;
      RAISE NOTICE 'users table query successful: % records found', users_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'users table query failed: %', SQLERRM;
    END;
    
    -- Test user_cart table access
    BEGIN
      SELECT COUNT(*) INTO cart_count FROM public.user_cart WHERE user_id = test_user_id;
      RAISE NOTICE 'user_cart query successful: % records found', cart_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'user_cart query failed: %', SQLERRM;
    END;
    
    -- Test user_game_purchases table access
    BEGIN
      SELECT COUNT(*) INTO purchases_count FROM public.user_game_purchases WHERE user_id = test_user_id;
      RAISE NOTICE 'user_game_purchases query successful: % records found', purchases_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'user_game_purchases query failed: %', SQLERRM;
    END;
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in RLS policies';
  RAISE NOTICE 'Created is_admin_user() function to avoid recursion';
  RAISE NOTICE 'All policies now use function-based admin checks';
  RAISE NOTICE 'This should resolve all 500 errors and infinite recursion issues';
END $$;
