-- Migration: Debug users table to see what users actually exist
-- This migration helps debug the users table issue

-- List all users in auth.users table
DO $$
DECLARE
  auth_user_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL USERS IN AUTH.USERS ===';
  FOR auth_user_record IN 
    SELECT id, email, created_at FROM auth.users ORDER BY created_at
  LOOP
    RAISE NOTICE 'Auth User: % (%) - Created: %', auth_user_record.email, auth_user_record.id, auth_user_record.created_at;
  END LOOP;
END $$;

-- List all users in public.users table
DO $$
DECLARE
  public_user_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL USERS IN PUBLIC.USERS ===';
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

-- Check if the specific user exists in auth.users
DO $$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT;
BEGIN
  -- Check with exact email
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'baraatel@gmail.com') INTO user_exists;
  RAISE NOTICE 'User baraatel@gmail.com exists in auth.users: %', user_exists;
  
  -- Check with case insensitive
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER('baraatel@gmail.com')) INTO user_exists;
  RAISE NOTICE 'User baraatel@gmail.com exists in auth.users (case insensitive): %', user_exists;
  
  -- Get the actual email if it exists
  SELECT email INTO user_email FROM auth.users WHERE LOWER(email) = LOWER('baraatel@gmail.com') LIMIT 1;
  IF user_email IS NOT NULL THEN
    RAISE NOTICE 'Actual email in database: %', user_email;
  ELSE
    RAISE NOTICE 'No matching user found';
  END IF;
END $$;

-- Create user record in public.users if it doesn't exist
DO $$
DECLARE
  auth_user_record RECORD;
  public_user_exists BOOLEAN;
BEGIN
  -- Get the user from auth.users (case insensitive)
  SELECT * INTO auth_user_record FROM auth.users WHERE LOWER(email) = LOWER('baraatel@gmail.com');
  
  IF auth_user_record IS NOT NULL THEN
    RAISE NOTICE 'Found user in auth.users: % (%)', auth_user_record.email, auth_user_record.id;
    
    -- Check if user exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth_user_record.id) INTO public_user_exists;
    
    IF public_user_exists THEN
      RAISE NOTICE 'User already exists in public.users table';
    ELSE
      RAISE NOTICE 'Creating user record in public.users table';
      
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

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed debugging users table';
END $$;
