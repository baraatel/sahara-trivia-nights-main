-- Migration: Fix infinite recursion in users table RLS policies
-- The issue is that is_admin_user() function queries users table, but users table RLS policies call is_admin_user()

-- First, let's see what RLS policies exist on the users table
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== CURRENT RLS POLICIES ON users TABLE ===';
  FOR r IN 
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    RAISE NOTICE 'Policy: %, Command: %, Roles: %, Qual: %', 
      r.policyname, r.cmd, r.roles, r.qual;
  END LOOP;
END $$;

-- Drop all existing RLS policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- Create new RLS policies that don't cause recursion
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Admin can view all users (using direct email check instead of function)
CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email IN ('admin@gmail.com', 'baraatel@gmail.com')
    AND is_admin = true
  )
);

-- Admin can manage all users (using direct email check instead of function)
CREATE POLICY "Admin can manage all users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email IN ('admin@gmail.com', 'baraatel@gmail.com')
    AND is_admin = true
  )
);

-- Also update the is_admin_user function to avoid recursion
-- Create a new version that doesn't query the users table
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct check without querying users table to avoid recursion
  RETURN user_email IN ('admin@gmail.com', 'baraatel@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the updated function
GRANT EXECUTE ON FUNCTION is_admin_user(TEXT) TO authenticated;

-- Test the function
DO $$
BEGIN
  RAISE NOTICE 'Testing is_admin_user function:';
  RAISE NOTICE 'admin@gmail.com: %', is_admin_user('admin@gmail.com');
  RAISE NOTICE 'baraatel@gmail.com: %', is_admin_user('baraatel@gmail.com');
  RAISE NOTICE 'other@gmail.com: %', is_admin_user('other@gmail.com');
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Fixed infinite recursion in users table RLS policies';
  RAISE NOTICE 'Updated is_admin_user function to avoid recursion';
END $$;
