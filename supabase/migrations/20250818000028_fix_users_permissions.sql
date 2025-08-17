-- Migration: Fix users table permissions and RLS policies
-- This migration ensures proper access to the users table for admin operations

-- First, let's check the current RLS status on users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    -- Check if RLS is enabled
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
      RAISE NOTICE 'RLS is enabled on users table';
    ELSE
      RAISE NOTICE 'RLS is disabled on users table';
    END IF;
  ELSE
    RAISE NOTICE 'users table does not exist';
  END IF;
END $$;

-- Drop existing RLS policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;

-- Create new RLS policies that work with our admin system
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'email' IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'email' IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  auth.jwt() ->> 'email' IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can update all users" ON public.users
FOR UPDATE USING (
  auth.jwt() ->> 'email' IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Also ensure game_packages table has proper permissions
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.game_packages;
DROP POLICY IF EXISTS "Admin can manage packages" ON public.game_packages;

CREATE POLICY "Anyone can view active packages" ON public.game_packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage packages" ON public.game_packages
FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Ensure game_package_features table has proper permissions
DROP POLICY IF EXISTS "Anyone can view package features" ON public.game_package_features;
DROP POLICY IF EXISTS "Admin can manage package features" ON public.game_package_features;

CREATE POLICY "Anyone can view package features" ON public.game_package_features
FOR SELECT USING (true);

CREATE POLICY "Admin can manage package features" ON public.game_package_features
FOR ALL USING (
  auth.jwt() ->> 'email' IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for users, game_packages, and game_package_features tables';
  RAISE NOTICE 'Admin users (admin@gmail.com, baraatel@gmail.com) now have full access';
END $$;
