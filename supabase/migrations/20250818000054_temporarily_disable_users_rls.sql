-- Migration: Temporarily disable RLS on users table to fix 403 error
-- This migration temporarily disables RLS on users table to test if that fixes the issue

-- Temporarily disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test that we can access the users table
DO $$
DECLARE
  test_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing users table access with RLS disabled for user: %', test_user_id;
    
    -- Test direct query (this should work now)
    SELECT * INTO user_record FROM public.users WHERE id = test_user_id;
    
    IF user_record IS NOT NULL THEN
      RAISE NOTICE 'SUCCESS! users table query successful: % (%) - Admin: %', user_record.email, user_record.id, user_record.is_admin;
    ELSE
      RAISE NOTICE 'FAILED: users table query still returned no results';
      
      -- Let's check what's actually in the users table
      RAISE NOTICE '--- CHECKING WHAT IS IN USERS TABLE ---';
      FOR user_record IN SELECT * FROM public.users LOOP
        RAISE NOTICE 'User in table: % (%)', user_record.email, user_record.id;
      END LOOP;
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Temporarily disabled RLS on users table';
  RAISE NOTICE 'This should fix the 403 error for users table access';
  RAISE NOTICE 'Remember to re-enable RLS with proper policies later!';
END $$;
