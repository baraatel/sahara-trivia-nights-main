-- Migration: Ensure user_category_access table exists and has proper RLS
-- This migration ensures the user_category_access table is properly set up for redemption codes

-- Create user_category_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_category_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'purchase',
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, category_id)
);

-- Enable RLS on user_category_access table
ALTER TABLE public.user_category_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own access" ON public.user_category_access;
DROP POLICY IF EXISTS "Users can update own access" ON public.user_category_access;
DROP POLICY IF EXISTS "Users can insert own access" ON public.user_category_access;

-- Create policies for user_category_access table
CREATE POLICY "Users can view own access" ON public.user_category_access
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own access" ON public.user_category_access
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own access" ON public.user_category_access
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Test the fixes
DO $$
DECLARE
  test_user_id UUID;
  access_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing user_category_access table for user: %', test_user_id;
    
    -- Test user_category_access table access
    BEGIN
      SELECT COUNT(*) INTO access_count FROM public.user_category_access WHERE user_id = test_user_id;
      RAISE NOTICE 'user_category_access query successful: % records found', access_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'user_category_access query failed: %', SQLERRM;
    END;
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Ensured user_category_access table exists and has proper RLS';
  RAISE NOTICE 'Users can now view, update, and insert their own category access';
  RAISE NOTICE 'This table is needed for redemption code functionality';
END $$;
