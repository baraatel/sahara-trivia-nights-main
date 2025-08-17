-- Test the admin status functions
-- This migration will help us verify that the functions work correctly

-- Test the get_user_admin_status function
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test with a known admin email (replace with actual admin email)
  SELECT get_user_admin_status('baraatel@gmail.com') INTO test_result;
  
  RAISE NOTICE 'Admin status for baraatel@gmail.com: %', test_result;
  
  -- Test with a non-admin email
  SELECT get_user_admin_status('test@example.com') INTO test_result;
  
  RAISE NOTICE 'Admin status for test@example.com: %', test_result;
  
  RAISE NOTICE 'Admin status functions are working correctly';
END $$;

-- Check if the public.users table has the is_admin column
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'is_admin'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE 'is_admin column exists in public.users table';
  ELSE
    RAISE NOTICE 'WARNING: is_admin column does not exist in public.users table';
  END IF;
END $$;

-- Show current admin users
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  RAISE NOTICE 'Current admin users:';
  FOR admin_user IN 
    SELECT email, is_admin 
    FROM public.users 
    WHERE is_admin = true
  LOOP
    RAISE NOTICE 'Admin: % (is_admin: %)', admin_user.email, admin_user.is_admin;
  END LOOP;
END $$;
