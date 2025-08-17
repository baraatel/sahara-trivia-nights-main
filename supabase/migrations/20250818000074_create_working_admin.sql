-- Create a working admin user
-- This migration ensures we have a proper admin user that can authenticate

-- First, let's check what users exist
DO $$
DECLARE
  auth_user_count INTEGER;
  public_user_count INTEGER;
  user_record RECORD;
BEGIN
  -- Check auth.users
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;
  
  -- Check public.users
  SELECT COUNT(*) INTO public_user_count FROM public.users;
  
  RAISE NOTICE 'Total users in auth.users: %', auth_user_count;
  RAISE NOTICE 'Total users in public.users: %', public_user_count;
  
  -- Show existing users in public.users
  RAISE NOTICE 'Users in public.users:';
  FOR user_record IN SELECT email, is_admin FROM public.users LOOP
    RAISE NOTICE '  % (admin: %)', user_record.email, user_record.is_admin;
  END LOOP;
END $$;

-- Create a new admin user in public.users that we can use
-- We'll use a simple email that you can create through the signup process
INSERT INTO public.users (email, username, full_name, is_admin)
VALUES ('testadmin@gmail.com', 'testadmin', 'Test Admin User', true)
ON CONFLICT (email) DO UPDATE SET 
  username = 'testadmin',
  full_name = 'Test Admin User',
  is_admin = true;

-- Also ensure admin@gmail.com is still an admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'admin@gmail.com';

-- Verify our admin users
DO $$
DECLARE
  admin_count INTEGER;
  admin_record RECORD;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.users 
  WHERE is_admin = true;
  
  RAISE NOTICE 'Total admin users: %', admin_count;
  
  RAISE NOTICE 'Admin users:';
  FOR admin_record IN SELECT email, username FROM public.users WHERE is_admin = true LOOP
    RAISE NOTICE '  % (%s)', admin_record.email, admin_record.username;
  END LOOP;
END $$;

-- Instructions for the user
DO $$
BEGIN
  RAISE NOTICE '=== ADMIN LOGIN INSTRUCTIONS ===';
  RAISE NOTICE 'Option 1: Use existing admin account';
  RAISE NOTICE '  Email: admin@gmail.com';
  RAISE NOTICE '  Password: admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Option 2: Create new admin account';
  RAISE NOTICE '  1. Go to Sign Up page';
  RAISE NOTICE '  2. Create account with: testadmin@gmail.com';
  RAISE NOTICE '  3. This user will automatically be an admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Option 3: Create any account and make it admin';
  RAISE NOTICE '  1. Sign up with any email';
  RAISE NOTICE '  2. Tell me the email and I will make it admin';
END $$;
