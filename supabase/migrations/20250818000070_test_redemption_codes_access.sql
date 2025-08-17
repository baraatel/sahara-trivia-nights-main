-- Test redemption codes access for admin users
-- This migration verifies that the RLS policies are working correctly

-- Check if redemption_codes table has RLS enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relname = 'redemption_codes';
  
  RAISE NOTICE 'RLS enabled on redemption_codes table: %', rls_enabled;
END $$;

-- Check existing policies on redemption_codes table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== EXISTING POLICIES ON redemption_codes TABLE ===';
  FOR policy_record IN 
    SELECT policyname, cmd, roles, qual 
    FROM pg_policies 
    WHERE tablename = 'redemption_codes'
  LOOP
    RAISE NOTICE 'Policy: %', policy_record.policyname;
    RAISE NOTICE '  Command: %', policy_record.cmd;
    RAISE NOTICE '  Roles: %', policy_record.roles;
    RAISE NOTICE '  Qualifier: %', policy_record.qual;
    RAISE NOTICE '---';
  END LOOP;
END $$;

-- Test admin access to redemption codes
DO $$
DECLARE
  admin_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count total redemption codes
  SELECT COUNT(*) INTO total_count FROM redemption_codes;
  RAISE NOTICE 'Total redemption codes in table: %', total_count;
  
  -- Test if admin can see all codes (this should work)
  SELECT COUNT(*) INTO admin_count 
  FROM redemption_codes 
  WHERE is_admin_user();
  
  RAISE NOTICE 'Admin can see % redemption codes', admin_count;
  
  IF admin_count = total_count THEN
    RAISE NOTICE 'SUCCESS: Admin can access all redemption codes';
  ELSE
    RAISE NOTICE 'WARNING: Admin cannot access all redemption codes';
  END IF;
END $$;

-- Verify the is_admin_user function works
DO $$
DECLARE
  admin_result BOOLEAN;
BEGIN
  SELECT is_admin_user() INTO admin_result;
  RAISE NOTICE 'is_admin_user() function result: %', admin_result;
END $$;
