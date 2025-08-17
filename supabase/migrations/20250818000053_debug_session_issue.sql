-- Migration: Debug session issue and check user ID mismatch
-- This migration helps debug why the user can't access their own profile

-- Check what users exist and their IDs
DO $$
DECLARE
  auth_user_record RECORD;
  public_user_record RECORD;
BEGIN
  RAISE NOTICE '=== DEBUGGING USER ID MISMATCH ===';
  
  -- Check auth.users
  RAISE NOTICE '--- AUTH.USERS TABLE ---';
  FOR auth_user_record IN 
    SELECT id, email, created_at FROM auth.users ORDER BY created_at
  LOOP
    RAISE NOTICE 'Auth User: % (%) - Created: %', auth_user_record.email, auth_user_record.id, auth_user_record.created_at;
  END LOOP;
  
  -- Check public.users
  RAISE NOTICE '--- PUBLIC.USERS TABLE ---';
  FOR public_user_record IN 
    SELECT id, email, full_name, is_admin, created_at FROM public.users ORDER BY created_at
  LOOP
    RAISE NOTICE 'Public User: % (%) - Name: % - Admin: % - Created: %', 
      public_user_record.email, 
      public_user_record.id, 
      public_user_record.full_name,
      public_user_record.is_admin,
      public_user_record.created_at;
  END LOOP;
END $$;

-- Check if there's a mismatch between auth.users and public.users
DO $$
DECLARE
  auth_user_record RECORD;
  public_user_record RECORD;
BEGIN
  RAISE NOTICE '--- CHECKING FOR MISMATCHES ---';
  
  -- Check if baraatel@gmail.com exists in both tables with same ID
  SELECT * INTO auth_user_record FROM auth.users WHERE email = 'baraatel@gmail.com';
  SELECT * INTO public_user_record FROM public.users WHERE email = 'baraatel@gmail.com';
  
  IF auth_user_record IS NOT NULL AND public_user_record IS NOT NULL THEN
    IF auth_user_record.id = public_user_record.id THEN
      RAISE NOTICE 'User IDs match: %', auth_user_record.id;
    ELSE
      RAISE NOTICE 'USER ID MISMATCH!';
      RAISE NOTICE 'Auth ID: %', auth_user_record.id;
      RAISE NOTICE 'Public ID: %', public_user_record.id;
    END IF;
  ELSE
    RAISE NOTICE 'User not found in one or both tables';
    IF auth_user_record IS NULL THEN
      RAISE NOTICE 'User not found in auth.users';
    END IF;
    IF public_user_record IS NULL THEN
      RAISE NOTICE 'User not found in public.users';
    END IF;
  END IF;
END $$;

-- Try to fix any mismatches by updating public.users to match auth.users
DO $$
DECLARE
  auth_user_record RECORD;
  public_user_record RECORD;
BEGIN
  RAISE NOTICE '--- FIXING ANY MISMATCHES ---';
  
  -- Get the auth user
  SELECT * INTO auth_user_record FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF auth_user_record IS NOT NULL THEN
    RAISE NOTICE 'Found auth user: % (%)', auth_user_record.email, auth_user_record.id;
    
    -- Check if public user exists with different ID
    SELECT * INTO public_user_record FROM public.users WHERE email = 'baraatel@gmail.com';
    
    IF public_user_record IS NOT NULL THEN
      IF auth_user_record.id != public_user_record.id THEN
        RAISE NOTICE 'Fixing ID mismatch...';
        RAISE NOTICE 'Updating public.users record from % to %', public_user_record.id, auth_user_record.id;
        
        -- Update the public.users record to use the correct ID
        UPDATE public.users 
        SET id = auth_user_record.id,
            created_at = auth_user_record.created_at,
            updated_at = now()
        WHERE email = 'baraatel@gmail.com';
        
        RAISE NOTICE 'Updated public.users record';
      ELSE
        RAISE NOTICE 'IDs already match';
      END IF;
    ELSE
      RAISE NOTICE 'Creating missing public.users record';
      
      -- Create the public.users record
      INSERT INTO public.users (id, email, full_name, is_admin, created_at, updated_at)
      VALUES (
        auth_user_record.id,
        auth_user_record.email,
        COALESCE(auth_user_record.raw_user_meta_data->>'full_name', 'Bara AlAtel'),
        true,
        auth_user_record.created_at,
        now()
      );
      
      RAISE NOTICE 'Created public.users record';
    END IF;
  ELSE
    RAISE NOTICE 'Auth user not found';
  END IF;
END $$;

-- Test access again
DO $$
DECLARE
  test_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing users table access for user: %', test_user_id;
    
    -- Test direct query
    SELECT * INTO user_record FROM public.users WHERE id = test_user_id;
    
    IF user_record IS NOT NULL THEN
      RAISE NOTICE 'SUCCESS! users table query successful: % (%) - Admin: %', user_record.email, user_record.id, user_record.is_admin;
    ELSE
      RAISE NOTICE 'FAILED: users table query returned no results';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed debugging and fixing user ID mismatch';
END $$;
