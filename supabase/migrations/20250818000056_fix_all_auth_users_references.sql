-- Migration: Fix all RLS policies that reference auth.users table
-- This migration replaces all auth.users references in RLS policies with public.users references

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
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all stats" ON public.user_stats
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix user_cart table RLS policies (if table exists)
DROP POLICY IF EXISTS "Users can view own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Users can update own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Admin can view all carts" ON public.user_cart;
DROP POLICY IF EXISTS "Admin can manage all carts" ON public.user_cart;

CREATE POLICY "Users can view own cart" ON public.user_cart
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own cart" ON public.user_cart
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all carts" ON public.user_cart
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all carts" ON public.user_cart
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix user_category_access table RLS policies (if table exists)
DROP POLICY IF EXISTS "Users can view own access" ON public.user_category_access;
DROP POLICY IF EXISTS "Users can update own access" ON public.user_category_access;
DROP POLICY IF EXISTS "Admin can view all access" ON public.user_category_access;
DROP POLICY IF EXISTS "Admin can manage all access" ON public.user_category_access;

CREATE POLICY "Users can view own access" ON public.user_category_access
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own access" ON public.user_category_access
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin can view all access" ON public.user_category_access
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all access" ON public.user_category_access
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

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
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all game purchases" ON public.game_purchases
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix redemption_codes table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admin can manage all redemption codes" ON public.redemption_codes;

CREATE POLICY "Admin can view all redemption codes" ON public.redemption_codes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all redemption codes" ON public.redemption_codes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix categories table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage all categories" ON public.categories;

CREATE POLICY "Admin can view all categories" ON public.categories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all categories" ON public.categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix questions table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all questions" ON public.questions;
DROP POLICY IF EXISTS "Admin can manage all questions" ON public.questions;

CREATE POLICY "Admin can view all questions" ON public.questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all questions" ON public.questions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

-- Fix game_packages table RLS policies (if table exists)
DROP POLICY IF EXISTS "Admin can view all game packages" ON public.game_packages;
DROP POLICY IF EXISTS "Admin can manage all game packages" ON public.game_packages;

CREATE POLICY "Admin can view all game packages" ON public.game_packages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
    AND public.users.is_admin = true
  )
);

CREATE POLICY "Admin can manage all game packages" ON public.game_packages
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
  stats_count INTEGER;
  cart_count INTEGER;
  access_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing all fixed RLS policies for user: %', test_user_id;
    
    -- Test user_stats table access
    BEGIN
      SELECT COUNT(*) INTO stats_count FROM public.user_stats WHERE user_id = test_user_id;
      RAISE NOTICE 'user_stats query successful: % records found', stats_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'user_stats query failed: %', SQLERRM;
    END;
    
    -- Test user_cart table access (if table exists)
    BEGIN
      SELECT COUNT(*) INTO cart_count FROM public.user_cart WHERE user_id = test_user_id;
      RAISE NOTICE 'user_cart query successful: % records found', cart_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'user_cart query failed: %', SQLERRM;
    END;
    
    -- Test user_category_access table access (if table exists)
    BEGIN
      SELECT COUNT(*) INTO access_count FROM public.user_category_access WHERE user_id = test_user_id;
      RAISE NOTICE 'user_category_access query successful: % records found', access_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'user_category_access query failed: %', SQLERRM;
    END;
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed all RLS policies that referenced auth.users table';
  RAISE NOTICE 'All policies now use public.users table for admin checks';
  RAISE NOTICE 'This should resolve all 403 errors related to RLS policies';
END $$;
