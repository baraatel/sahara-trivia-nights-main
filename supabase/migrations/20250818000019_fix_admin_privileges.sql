-- Migration: Fix admin privileges for baraatel@gmail.com
-- This migration ensures comprehensive admin privileges are set

-- First, let's check and update the user in public.users
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id FROM public.users WHERE email = 'baraatel@gmail.com';
  
  IF user_id IS NOT NULL THEN
    -- Update public.users with admin privileges
    UPDATE public.users 
    SET 
      is_admin = true,
      full_name = COALESCE(full_name, 'Admin User'),
      username = COALESCE(username, 'baraatel_admin'),
      updated_at = now()
    WHERE email = 'baraatel@gmail.com';
    
    RAISE NOTICE 'Updated public.users for baraatel@gmail.com with admin privileges';
  ELSE
    RAISE NOTICE 'User baraatel@gmail.com not found in public.users';
  END IF;
END $$;

-- Update auth.users with super admin privileges
DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO auth_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF auth_user_id IS NOT NULL THEN
    -- Update auth.users with super admin privileges
    UPDATE auth.users 
    SET 
      is_super_admin = true,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        '{"is_admin": true, "full_name": "Admin User", "username": "baraatel_admin"}'::jsonb,
      updated_at = now()
    WHERE email = 'baraatel@gmail.com';
    
    RAISE NOTICE 'Updated auth.users for baraatel@gmail.com with super admin privileges';
  ELSE
    RAISE NOTICE 'User baraatel@gmail.com not found in auth.users';
  END IF;
END $$;

-- Create a function to check if user is admin (for RLS policies)
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = user_email AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin_user(TEXT) TO authenticated;

-- Update RLS policies to use the new admin check function
-- This ensures admin users can access all data
DO $$
BEGIN
  -- Update categories policies
  DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
  CREATE POLICY "Admin can manage categories" ON public.categories 
  FOR ALL USING (
    is_admin_user(auth.jwt() ->> 'email')
  );
  
  -- Update questions policies
  DROP POLICY IF EXISTS "Admin can manage questions" ON public.questions;
  CREATE POLICY "Admin can manage questions" ON public.questions 
  FOR ALL USING (
    is_admin_user(auth.jwt() ->> 'email')
  );
  
  -- Update user_purchases policies
  DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_purchases;
  CREATE POLICY "Admin can view all purchases" ON public.user_purchases 
  FOR SELECT USING (
    is_admin_user(auth.jwt() ->> 'email')
  );
  
  RAISE NOTICE 'Updated RLS policies to use new admin check function';
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Comprehensive admin privileges set for baraatel@gmail.com';
  RAISE NOTICE 'Admin credentials: baraatel@gmail.com / (your password)';
  RAISE NOTICE 'Created is_admin_user() function for RLS policies';
END $$;
