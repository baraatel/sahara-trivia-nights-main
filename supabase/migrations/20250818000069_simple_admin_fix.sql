b-- Simple fix for admin access issue
-- This migration ensures admin users can access redemption codes

-- First, let's check the current state
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.users 
  WHERE is_admin = true;
  
  RAISE NOTICE 'Current admin users: %', admin_count;
END $$;

-- Ensure baraatel@gmail.com is an admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'baraatel@gmail.com';

-- Verify the fix
DO $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = 'baraatel@gmail.com';
  
  RAISE NOTICE 'baraatel@gmail.com admin status: %', admin_status;
END $$;

-- Test the admin function
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test with a hardcoded admin check
  SELECT get_user_admin_status('baraatel@gmail.com') INTO test_result;
  RAISE NOTICE 'get_user_admin_status for baraatel@gmail.com: %', test_result;
END $$;
