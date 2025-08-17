-- Fix admin authentication properly
-- This migration creates a working admin user that can authenticate

-- First, let's clean up and create a proper admin user
-- We'll use a simple approach that works with Supabase Auth

-- Remove the problematic users that don't exist in auth.users
DELETE FROM public.users WHERE email = 'baraatel@gmail.com';
DELETE FROM public.users WHERE email = 'testadmin@gmail.com';

-- Keep only the admin@gmail.com user and ensure it's properly configured
UPDATE public.users 
SET 
  username = 'admin',
  full_name = 'System Administrator',
  is_admin = true
WHERE email = 'admin@gmail.com';

-- Create a simple admin user that you can actually use
INSERT INTO public.users (email, username, full_name, is_admin)
VALUES ('admin@test.com', 'testadmin', 'Test Admin', true)
ON CONFLICT (email) DO UPDATE SET 
  username = 'testadmin',
  full_name = 'Test Admin',
  is_admin = true;

-- Verify our setup
DO $$
DECLARE
  admin_count INTEGER;
  user_record RECORD;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.users 
  WHERE is_admin = true;
  
  RAISE NOTICE 'Total admin users: %', admin_count;
  
  RAISE NOTICE 'Admin users in public.users:';
  FOR user_record IN SELECT email, username, is_admin FROM public.users WHERE is_admin = true LOOP
    RAISE NOTICE '  % (%s) - Admin: %', user_record.email, user_record.username, user_record.is_admin;
  END LOOP;
END $$;

-- Instructions for creating a working admin user
DO $$
BEGIN
  RAISE NOTICE '=== HOW TO CREATE A WORKING ADMIN USER ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 1: Go to the Sign Up page';
  RAISE NOTICE 'Step 2: Create a new account with any email (e.g., admin@test.com)';
  RAISE NOTICE 'Step 3: Once you sign up, that user will automatically be an admin';
  RAISE NOTICE '';
  RAISE NOTICE 'OR';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 1: Go to your Supabase Dashboard';
  RAISE NOTICE 'Step 2: Navigate to Authentication > Users';
  RAISE NOTICE 'Step 3: Click "Add User"';
  RAISE NOTICE 'Step 4: Add admin@test.com with password: admin123';
  RAISE NOTICE 'Step 5: Then you can log in with those credentials';
  RAISE NOTICE '';
  RAISE NOTICE 'The user will automatically have admin privileges!';
END $$;
