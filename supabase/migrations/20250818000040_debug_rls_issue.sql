-- Migration: Debug RLS issue with user_stats table
-- This migration helps debug why users are getting 403 errors

-- First, let's check if RLS is enabled on the user_stats table
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_stats' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'RLS is ENABLED on user_stats table';
  ELSE
    RAISE NOTICE 'RLS is DISABLED on user_stats table';
  END IF;
END $$;

-- Check what policies exist on user_stats table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== EXISTING POLICIES ON user_stats TABLE ===';
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'user_stats' AND schemaname = 'public'
  LOOP
    RAISE NOTICE 'Policy: %', policy_record.policyname;
    RAISE NOTICE '  Command: %', policy_record.cmd;
    RAISE NOTICE '  Roles: %', policy_record.roles;
    RAISE NOTICE '  Qualifier: %', policy_record.qual;
    RAISE NOTICE '  With Check: %', policy_record.with_check;
    RAISE NOTICE '---';
  END LOOP;
END $$;

-- Check if there are any user_stats records
DO $$
DECLARE
  stats_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stats_count FROM public.user_stats;
  RAISE NOTICE 'Total user_stats records: %', stats_count;
END $$;

-- Check if specific users have user_stats records
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== CHECKING USER_STATS RECORDS FOR SPECIFIC USERS ===';
  FOR user_record IN 
    SELECT id, email FROM auth.users WHERE email IN ('admin@gmail.com', 'baraatel@gmail.com') OR id IN ('e5b3c74d-e818-451a-be1e-da687a1d9205', 'a996de82-6ef1-407a-b49a-841dfdab3692')
  LOOP
    DECLARE
      stats_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO stats_count FROM public.user_stats WHERE user_id = user_record.id;
      RAISE NOTICE 'User % (%) has % user_stats records', user_record.email, user_record.id, stats_count;
    END;
  END LOOP;
END $$;

-- Test the RLS policies directly
DO $$
DECLARE
  test_user_id UUID;
  stats_count INTEGER;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing RLS policies for user ID: %', test_user_id;
    
    -- Try to count records (this should work if RLS is working)
    SELECT COUNT(*) INTO stats_count FROM public.user_stats WHERE user_id = test_user_id;
    RAISE NOTICE 'Found % user_stats records for test user', stats_count;
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed RLS debugging for user_stats table';
END $$;
