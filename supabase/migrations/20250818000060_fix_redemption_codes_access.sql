-- Migration: Fix redemption codes access
-- This migration adds proper RLS policies for the redemption_codes table

-- Enable RLS on redemption_codes table if not already enabled
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admin can view all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admin can manage all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Users can view redemption codes" ON public.redemption_codes;

-- Create policies for redemption_codes table
-- Users can view active redemption codes (for redemption purposes)
CREATE POLICY "Users can view active redemption codes" ON public.redemption_codes
FOR SELECT USING (is_active = true);

-- Admin can view all redemption codes
CREATE POLICY "Admin can view all redemption codes" ON public.redemption_codes
FOR SELECT USING (public.is_admin_user());

-- Admin can manage all redemption codes
CREATE POLICY "Admin can manage all redemption codes" ON public.redemption_codes
FOR ALL USING (public.is_admin_user());

-- Test the fixes
DO $$
DECLARE
  test_user_id UUID;
  redemption_codes_count INTEGER;
  active_codes_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing redemption_codes table access for user: %', test_user_id;
    
    -- Test redemption_codes table access
    BEGIN
      SELECT COUNT(*) INTO redemption_codes_count FROM public.redemption_codes;
      RAISE NOTICE 'redemption_codes query successful: % total codes found', redemption_codes_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'redemption_codes query failed: %', SQLERRM;
    END;
    
    -- Test active redemption codes access
    BEGIN
      SELECT COUNT(*) INTO active_codes_count FROM public.redemption_codes WHERE is_active = true;
      RAISE NOTICE 'active redemption_codes query successful: % active codes found', active_codes_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'active redemption_codes query failed: %', SQLERRM;
    END;
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed redemption codes access';
  RAISE NOTICE 'Added RLS policies for redemption_codes table';
  RAISE NOTICE 'Users can now view active redemption codes';
  RAISE NOTICE 'Admins can view and manage all redemption codes';
END $$;
