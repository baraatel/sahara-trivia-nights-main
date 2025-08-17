-- Migration: Make baraatel@gmail.com an admin user
-- This migration updates the user to have admin privileges

-- Update the user in public.users to be an admin
UPDATE public.users 
SET 
  is_admin = true,
  full_name = COALESCE(full_name, 'Admin User'),
  updated_at = now()
WHERE email = 'baraatel@gmail.com';

-- Also update the user in auth.users to be a super admin
UPDATE auth.users 
SET 
  is_super_admin = true,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb,
  updated_at = now()
WHERE email = 'baraatel@gmail.com';

-- Log completion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'baraatel@gmail.com') THEN
    RAISE NOTICE 'Migration completed: baraatel@gmail.com is now an admin user.';
    RAISE NOTICE 'Admin credentials: baraatel@gmail.com / (your password)';
  ELSE
    RAISE NOTICE 'User baraatel@gmail.com not found in public.users';
  END IF;
END $$;
