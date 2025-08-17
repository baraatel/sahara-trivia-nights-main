-- Fix admin user status for baraatel@gmail.com
-- This migration ensures the user has proper admin privileges

-- First, check if the user exists in public.users
DO $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID;
BEGIN
  -- Check if user exists in public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'baraatel@gmail.com') INTO user_exists;
  
  IF user_exists THEN
    -- Update existing user to be admin
    UPDATE public.users 
    SET is_admin = true 
    WHERE email = 'baraatel@gmail.com';
    
    RAISE NOTICE 'Updated existing user baraatel@gmail.com to admin status';
  ELSE
    -- Create new admin user
    INSERT INTO public.users (email, username, full_name, is_admin)
    VALUES ('baraatel@gmail.com', 'baraatel', 'Baraatel Admin', true);
    
    RAISE NOTICE 'Created new admin user baraatel@gmail.com';
  END IF;
END $$;

-- Verify the admin status
DO $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = 'baraatel@gmail.com';
  
  RAISE NOTICE 'Admin status for baraatel@gmail.com: %', admin_status;
  
  IF admin_status THEN
    RAISE NOTICE 'SUCCESS: baraatel@gmail.com is now an admin user';
  ELSE
    RAISE NOTICE 'ERROR: Failed to set baraatel@gmail.com as admin';
  END IF;
END $$;
