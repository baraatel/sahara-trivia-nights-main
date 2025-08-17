-- Fix the get_user_admin_status function to work with RLS
-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_admin_status(TEXT);

-- Create a new function that uses auth.users instead of public.users
CREATE OR REPLACE FUNCTION get_user_admin_status(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Use auth.users which doesn't have RLS restrictions
  SELECT is_admin INTO admin_status 
  FROM auth.users 
  WHERE email = user_email;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the is_admin_user function to be more robust
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  admin_status BOOLEAN;
BEGIN
  -- Get the current user's email from JWT
  user_email := auth.jwt() ->> 'email';
  
  -- Check if user is admin using auth.users
  SELECT is_admin INTO admin_status 
  FROM auth.users 
  WHERE email = user_email;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
DO $$
BEGIN
  RAISE NOTICE 'Updated admin status functions to use auth.users';
  RAISE NOTICE 'This should resolve permission issues for admin components';
END $$;
