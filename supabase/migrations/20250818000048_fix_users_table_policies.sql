-- Migration: Fix users table RLS policies to be consistent
-- This migration fixes the users table policies to use the same pattern as other tables

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- Create consistent policies for users table
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Admin can manage all users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Also ensure the users table has the correct structure
-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    RAISE NOTICE 'Adding is_admin column to users table';
    ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  ELSE
    RAISE NOTICE 'is_admin column already exists in users table';
  END IF;
END $$;

-- Update the existing user to be admin
UPDATE public.users 
SET is_admin = true 
WHERE email IN ('admin@gmail.com', 'baraatel@gmail.com');

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed users table RLS policies to be consistent with other tables';
  RAISE NOTICE 'Users can now access their own profile and admins have full access';
END $$;
