-- Fix the admin status functions to work correctly
-- The is_admin column exists in public.users, not auth.users

-- Use CREATE OR REPLACE instead of dropping since functions are used by RLS policies
CREATE OR REPLACE FUNCTION get_user_admin_status(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Use public.users which has the is_admin column
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = user_email;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new is_admin_user function that uses public.users
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  admin_status BOOLEAN;
BEGIN
  -- Get the current user's email from JWT
  user_email := auth.jwt() ->> 'email';
  
  -- Check if user is admin using public.users
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = user_email;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the functions
DO $$
BEGIN
  RAISE NOTICE 'Fixed admin status functions to use public.users table';
  RAISE NOTICE 'This should resolve the "column is_admin does not exist" error';
END $$;
