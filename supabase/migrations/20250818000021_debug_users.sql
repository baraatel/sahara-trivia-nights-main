-- Migration: Debug all users in the database
-- This migration lists all users to understand the current state

-- List all users in public.users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL USERS IN public.users ===';
  FOR user_record IN SELECT * FROM public.users ORDER BY created_at LOOP
    RAISE NOTICE 'ID: %, Email: %, Username: %, Full Name: %, Is Admin: %, Created: %', 
      user_record.id, user_record.email, user_record.username, user_record.full_name, 
      user_record.is_admin, user_record.created_at;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No users found in public.users table';
  END IF;
END $$;

-- List all users in auth.users
DO $$
DECLARE
  auth_user_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL USERS IN auth.users ===';
  FOR auth_user_record IN SELECT id, email, is_super_admin, raw_user_meta_data, created_at FROM auth.users ORDER BY created_at LOOP
    RAISE NOTICE 'ID: %, Email: %, Is Super Admin: %, Meta Data: %, Created: %', 
      auth_user_record.id, auth_user_record.email, auth_user_record.is_super_admin, 
      auth_user_record.raw_user_meta_data, auth_user_record.created_at;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No users found in auth.users table';
  END IF;
END $$;

-- Check if there are any admin users
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE is_admin = true;
  RAISE NOTICE 'Total admin users in public.users: %', admin_count;
  
  SELECT COUNT(*) INTO admin_count FROM auth.users WHERE is_super_admin = true;
  RAISE NOTICE 'Total super admin users in auth.users: %', admin_count;
END $$;

-- Test the is_admin_user function with all emails
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== TESTING is_admin_user FUNCTION ===';
  FOR user_record IN SELECT email FROM public.users LOOP
    RAISE NOTICE 'Email: %, Is Admin: %', user_record.email, is_admin_user(user_record.email);
  END LOOP;
END $$;
