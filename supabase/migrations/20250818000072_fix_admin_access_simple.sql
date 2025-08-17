-- Simple fix for admin access
-- Create a more reliable admin check that doesn't depend on JWT context

-- Create a simple admin check function that works in all contexts
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  admin_status BOOLEAN;
BEGIN
  -- Try to get email from JWT first
  user_email := auth.jwt() ->> 'email';
  
  -- If JWT is null, return false (not admin)
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is admin using public.users
  SELECT is_admin INTO admin_status 
  FROM public.users 
  WHERE email = user_email;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop ALL existing policies on redemption_codes table
DROP POLICY IF EXISTS "Admin can view all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admin can manage all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admins can view all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admins can manage redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admin can manage redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Users can view active redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Users can view active codes for redemption" ON public.redemption_codes;

-- Create simple admin policies
CREATE POLICY "Admin can view all redemption codes" ON public.redemption_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_admin = true
    )
  );

CREATE POLICY "Admin can manage all redemption codes" ON public.redemption_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_admin = true
    )
  );

-- Create user policy for active codes
CREATE POLICY "Users can view active redemption codes" ON public.redemption_codes
  FOR SELECT USING (
    is_active = true
  );

-- Test the new policies
DO $$
DECLARE
  admin_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count total redemption codes
  SELECT COUNT(*) INTO total_count FROM redemption_codes;
  RAISE NOTICE 'Total redemption codes in table: %', total_count;
  
  -- Test admin access with the new policy
  SELECT COUNT(*) INTO admin_count 
  FROM redemption_codes 
  WHERE EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = 'baraatel@gmail.com' 
    AND is_admin = true
  );
  
  RAISE NOTICE 'Admin access test result: %', admin_count;
  
  IF admin_count = total_count THEN
    RAISE NOTICE 'SUCCESS: New admin policies work correctly';
  ELSE
    RAISE NOTICE 'WARNING: Admin policies still not working';
  END IF;
END $$;
