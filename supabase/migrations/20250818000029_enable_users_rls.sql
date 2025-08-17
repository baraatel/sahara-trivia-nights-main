-- Migration: Enable RLS on users table and create proper policies
-- This migration enables RLS and creates policies that work with the current system

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;

-- Create simple policies that allow access based on email
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (
  email = (auth.jwt() ->> 'email') OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (
  email = (auth.jwt() ->> 'email') OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can update all users" ON public.users
FOR UPDATE USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Also ensure game_packages and game_package_features have proper policies
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.game_packages;
DROP POLICY IF EXISTS "Admin can manage packages" ON public.game_packages;
DROP POLICY IF EXISTS "Anyone can view package features" ON public.game_package_features;
DROP POLICY IF EXISTS "Admin can manage package features" ON public.game_package_features;

-- Create new policies for game_packages
CREATE POLICY "Anyone can view active packages" ON public.game_packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage packages" ON public.game_packages
FOR ALL USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Create new policies for game_package_features
CREATE POLICY "Anyone can view package features" ON public.game_package_features
FOR SELECT USING (true);

CREATE POLICY "Admin can manage package features" ON public.game_package_features
FOR ALL USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Enabled RLS on users table and created proper policies';
  RAISE NOTICE 'Users can now access their own profiles and admins have full access';
END $$;
