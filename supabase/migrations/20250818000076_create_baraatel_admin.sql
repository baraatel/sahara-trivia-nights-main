-- Create baraatel@gmail.com as a working admin user
-- This migration ensures baraatel@gmail.com exists in both auth.users and public.users

-- First, let's check the current state
DO $$
DECLARE
  auth_user_count INTEGER;
  public_user_count INTEGER;
BEGIN
  -- Check auth.users
  SELECT COUNT(*) INTO auth_user_count 
  FROM auth.users 
  WHERE email = 'baraatel@gmail.com';
  
  -- Check public.users
  SELECT COUNT(*) INTO public_user_count 
  FROM public.users 
  WHERE email = 'baraatel@gmail.com';
  
  RAISE NOTICE 'baraatel@gmail.com in auth.users: %', auth_user_count;
  RAISE NOTICE 'baraatel@gmail.com in public.users: %', public_user_count;
END $$;

-- Create baraatel@gmail.com in public.users as admin
INSERT INTO public.users (email, username, full_name, is_admin)
VALUES ('baraatel@gmail.com', 'baraatel', 'Baraatel Admin', true)
ON CONFLICT (email) DO UPDATE SET 
  username = 'baraatel',
  full_name = 'Baraatel Admin',
  is_admin = true;

-- Verify the setup
DO $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = 'baraatel@gmail.com';
  
  RAISE NOTICE 'baraatel@gmail.com admin status: %', admin_status;
  
  IF admin_status THEN
    RAISE NOTICE 'SUCCESS: baraatel@gmail.com is configured as admin in public.users';
  ELSE
    RAISE NOTICE 'ERROR: Failed to configure baraatel@gmail.com as admin';
  END IF;
END $$;

-- Instructions for creating the auth user
DO $$
BEGIN
  RAISE NOTICE '=== TO COMPLETE THE SETUP ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 1: Go to your Supabase Dashboard';
  RAISE NOTICE 'Step 2: Navigate to Authentication > Users';
  RAISE NOTICE 'Step 3: Click "Add User"';
  RAISE NOTICE 'Step 4: Add:';
  RAISE NOTICE '  Email: baraatel@gmail.com';
  RAISE NOTICE '  Password: (choose any password you want)';
  RAISE NOTICE 'Step 5: Click "Add User"';
  RAISE NOTICE 'Step 6: Then you can log in with baraatel@gmail.com and your chosen password';
  RAISE NOTICE '';
  RAISE NOTICE 'The user will automatically have admin privileges!';
END $$;
