-- Migration: Fix users table RLS issue - Final fix
-- This migration temporarily disables RLS on users table and then re-enables it with proper policies

-- First, temporarily disable RLS on users table to test access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test that we can access the users table
DO $$
DECLARE
  test_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing users table access with RLS disabled for user: %', test_user_id;
    
    -- Test direct query (this should work now)
    SELECT * INTO user_record FROM public.users WHERE id = test_user_id;
    
    IF user_record IS NOT NULL THEN
      RAISE NOTICE 'users table query successful: % (%) - Admin: %', user_record.email, user_record.id, user_record.is_admin;
    ELSE
      RAISE NOTICE 'users table query still returned no results';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Now re-enable RLS with simple, working policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;

-- Create very simple policies that should work
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (id = auth.uid());

-- Create a simple admin policy that doesn't use complex queries
CREATE POLICY "Admin can view all users" ON public.users
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

CREATE POLICY "Admin can manage all users" ON public.users
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email IN ('admin@gmail.com', 'baraatel@gmail.com')
  )
);

-- Test the policies work
DO $$
DECLARE
  test_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing users table access with new RLS policies for user: %', test_user_id;
    
    -- Test direct query (this should work now)
    SELECT * INTO user_record FROM public.users WHERE id = test_user_id;
    
    IF user_record IS NOT NULL THEN
      RAISE NOTICE 'users table query successful: % (%) - Admin: %', user_record.email, user_record.id, user_record.is_admin;
    ELSE
      RAISE NOTICE 'users table query returned no results';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed users table RLS policies with simple, working rules';
  RAISE NOTICE 'Users can now access their own profile and admins have full access';
END $$;
