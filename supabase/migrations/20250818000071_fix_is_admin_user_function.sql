-- Fix the is_admin_user function
-- The function is returning false when it should return true for admin users

-- Drop and recreate the function with better logic
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  admin_status BOOLEAN;
BEGIN
  -- Get the current user's email from JWT
  user_email := auth.jwt() ->> 'email';
  
  -- Debug: log the email we're checking
  RAISE NOTICE 'Checking admin status for email: %', user_email;
  
  -- Check if user is admin using public.users
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = user_email;
  
  -- Debug: log the result
  RAISE NOTICE 'Admin status result: %', admin_status;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with known admin emails
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test with admin@gmail.com
  SELECT get_user_admin_status('admin@gmail.com') INTO test_result;
  RAISE NOTICE 'admin@gmail.com admin status: %', test_result;
  
  -- Test with baraatel@gmail.com
  SELECT get_user_admin_status('baraatel@gmail.com') INTO test_result;
  RAISE NOTICE 'baraatel@gmail.com admin status: %', test_result;
  
  -- Test the is_admin_user function (this will show the current user's status)
  SELECT is_admin_user() INTO test_result;
  RAISE NOTICE 'Current user admin status: %', test_result;
END $$;
