-- Migration: Fix admin authentication
-- This migration ensures the admin user is properly set up in both auth.users and public.users

-- Update admin user in auth.users if it exists
DO $$
BEGIN
  -- If admin user exists, update the password
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') THEN
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('admin', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now(),
      raw_user_meta_data = '{"full_name": "System Administrator", "username": "admin"}'::jsonb,
      is_super_admin = true
    WHERE email = 'admin@gmail.com';
    
    RAISE NOTICE 'Updated admin user password in auth.users';
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users';
  END IF;
END $$;

-- Update admin user in public.users if it exists
DO $$
BEGIN
  -- If admin user exists in public.users, update it
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@gmail.com') THEN
    UPDATE public.users 
    SET 
      username = 'admin',
      full_name = 'System Administrator',
      is_admin = true,
      updated_at = now()
    WHERE email = 'admin@gmail.com';
    
    RAISE NOTICE 'Updated admin user in public.users';
  ELSE
    RAISE NOTICE 'Admin user not found in public.users';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Admin user authentication fixed.';
  RAISE NOTICE 'Admin credentials: admin@gmail.com / admin';
END $$;
