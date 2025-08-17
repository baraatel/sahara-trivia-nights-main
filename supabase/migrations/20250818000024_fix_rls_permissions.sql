-- Migration: Fix RLS permissions for other tables
-- This migration ensures admin users can access all tables without permission issues

-- Fix game_packages table RLS
DROP POLICY IF EXISTS "Admin can manage packages" ON public.game_packages;
DROP POLICY IF EXISTS "Users can view packages" ON public.game_packages;

-- Create new policies for game_packages
CREATE POLICY "Admin can manage packages" ON public.game_packages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Users can view packages" ON public.game_packages
FOR SELECT USING (is_active = true);

-- Fix game_package_features table RLS
DROP POLICY IF EXISTS "Admin can manage package features" ON public.game_package_features;
DROP POLICY IF EXISTS "Users can view package features" ON public.game_package_features;

-- Create new policies for game_package_features
CREATE POLICY "Admin can manage package features" ON public.game_package_features
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Users can view package features" ON public.game_package_features
FOR SELECT USING (true);

-- Fix user_game_purchases table RLS
DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can make purchases" ON public.user_game_purchases;

-- Create new policies for user_game_purchases
CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix user_stats table RLS
DROP POLICY IF EXISTS "Admin can view all stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can create own stats" ON public.user_stats;

-- Create new policies for user_stats
CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Users can view own stats" ON public.user_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stats" ON public.user_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Fixed RLS permissions for all tables';
  RAISE NOTICE 'Admin users can now access all tables without permission issues';
END $$;
