-- Migration: Fix users table record for the current user
-- This migration ensures the user has a record in the public.users table

-- Check if the user exists in public.users table
DO $$
DECLARE
  user_exists BOOLEAN;
  auth_user_record RECORD;
BEGIN
  -- Get the user from auth.users
  SELECT * INTO auth_user_record FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF auth_user_record IS NOT NULL THEN
    RAISE NOTICE 'Found user in auth.users: % (%)', auth_user_record.email, auth_user_record.id;
    
    -- Check if user exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth_user_record.id) INTO user_exists;
    
    IF user_exists THEN
      RAISE NOTICE 'User already exists in public.users table';
    ELSE
      RAISE NOTICE 'User does NOT exist in public.users table - creating record';
      
      -- Create user record in public.users
      INSERT INTO public.users (id, email, full_name, is_admin, created_at, updated_at)
      VALUES (
        auth_user_record.id,
        auth_user_record.email,
        COALESCE(auth_user_record.raw_user_meta_data->>'full_name', 'User'),
        true, -- Make this user admin
        auth_user_record.created_at,
        now()
      );
      
      RAISE NOTICE 'Created user record in public.users table';
    END IF;
  ELSE
    RAISE NOTICE 'User not found in auth.users table';
  END IF;
END $$;

-- Enable RLS on users table if it's disabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'Enabling RLS on users table';
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'RLS is already enabled on users table';
  END IF;
END $$;

-- Test the users table access again
DO $$
DECLARE
  test_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing users table access for user: %', test_user_id;
    
    -- Test direct query (this should work now)
    SELECT * INTO user_record FROM public.users WHERE id = test_user_id;
    
    IF user_record IS NOT NULL THEN
      RAISE NOTICE 'users table query successful: % (%) - Admin: %', user_record.email, user_record.id, user_record.is_admin;
    ELSE
      RAISE NOTICE 'users table query still returned no results';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed fixing users table record and RLS';
END $$;
