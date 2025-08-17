-- Migration: Verify admin status for baraatel@gmail.com
-- This migration checks and logs the current status

-- Check and log the status in public.users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM public.users WHERE email = 'baraatel@gmail.com';
  
  IF user_record IS NOT NULL THEN
    RAISE NOTICE 'User found in public.users:';
    RAISE NOTICE '  ID: %', user_record.id;
    RAISE NOTICE '  Email: %', user_record.email;
    RAISE NOTICE '  Username: %', user_record.username;
    RAISE NOTICE '  Full Name: %', user_record.full_name;
    RAISE NOTICE '  Is Admin: %', user_record.is_admin;
    RAISE NOTICE '  Created At: %', user_record.created_at;
    RAISE NOTICE '  Updated At: %', user_record.updated_at;
  ELSE
    RAISE NOTICE 'User baraatel@gmail.com NOT found in public.users';
  END IF;
END $$;

-- Check and log the status in auth.users
DO $$
DECLARE
  auth_user_record RECORD;
BEGIN
  SELECT * INTO auth_user_record FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF auth_user_record IS NOT NULL THEN
    RAISE NOTICE 'User found in auth.users:';
    RAISE NOTICE '  ID: %', auth_user_record.id;
    RAISE NOTICE '  Email: %', auth_user_record.email;
    RAISE NOTICE '  Is Super Admin: %', auth_user_record.is_super_admin;
    RAISE NOTICE '  Raw User Meta Data: %', auth_user_record.raw_user_meta_data;
    RAISE NOTICE '  Created At: %', auth_user_record.created_at;
    RAISE NOTICE '  Updated At: %', auth_user_record.updated_at;
  ELSE
    RAISE NOTICE 'User baraatel@gmail.com NOT found in auth.users';
  END IF;
END $$;

-- Test the is_admin_user function
DO $$
BEGIN
  RAISE NOTICE 'Testing is_admin_user function for baraatel@gmail.com: %', is_admin_user('baraatel@gmail.com');
END $$;

-- Ensure the user has admin privileges (re-apply if needed)
UPDATE public.users 
SET 
  is_admin = true,
  full_name = COALESCE(full_name, 'Admin User'),
  username = COALESCE(username, 'baraatel_admin'),
  updated_at = now()
WHERE email = 'baraatel@gmail.com';

UPDATE auth.users 
SET 
  is_super_admin = true,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"is_admin": true, "full_name": "Admin User", "username": "baraatel_admin"}'::jsonb,
  updated_at = now()
WHERE email = 'baraatel@gmail.com';

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Final verification - is_admin_user function result: %', is_admin_user('baraatel@gmail.com');
  RAISE NOTICE 'Migration completed: Admin privileges verified and ensured for baraatel@gmail.com';
END $$;
