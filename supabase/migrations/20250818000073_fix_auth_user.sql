-- Fix authentication for admin user
-- Ensure baraatel@gmail.com exists in both auth.users and public.users tables

-- Check current state
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

-- Create the user in auth.users if it doesn't exist
-- Note: We can't directly insert into auth.users, so we'll use a different approach
-- The user needs to be created through Supabase Auth or manually in the dashboard

-- For now, let's ensure the public.users record is correct
UPDATE public.users 
SET 
  username = 'baraatel',
  full_name = 'Baraatel Admin',
  is_admin = true
WHERE email = 'baraatel@gmail.com';

-- If the user doesn't exist in public.users, create it
INSERT INTO public.users (email, username, full_name, is_admin)
SELECT 'baraatel@gmail.com', 'baraatel', 'Baraatel Admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'baraatel@gmail.com'
);

-- Verify the fix
DO $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = 'baraatel@gmail.com';
  
  RAISE NOTICE 'baraatel@gmail.com admin status: %', admin_status;
  
  IF admin_status THEN
    RAISE NOTICE 'SUCCESS: baraatel@gmail.com is properly configured in public.users';
    RAISE NOTICE 'NOTE: You may need to create this user in Supabase Auth dashboard or sign up normally';
  ELSE
    RAISE NOTICE 'ERROR: Failed to configure baraatel@gmail.com as admin';
  END IF;
END $$;
