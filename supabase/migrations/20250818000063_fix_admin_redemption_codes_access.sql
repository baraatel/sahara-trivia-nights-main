-- Fix admin access to redemption codes
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view active redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admins can view all redemption codes" ON public.redemption_codes;
DROP POLICY IF EXISTS "Admins can manage redemption codes" ON public.redemption_codes;

-- Create new policies that properly handle admin access
CREATE POLICY "Users can view active redemption codes" ON public.redemption_codes
  FOR SELECT USING (
    is_active = true
  );

CREATE POLICY "Admins can view all redemption codes" ON public.redemption_codes
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage redemption codes" ON public.redemption_codes
  FOR ALL USING (
    public.is_admin_user()
  );

-- Also fix categories access for admin
DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Users can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can view all categories" ON public.categories
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    public.is_admin_user()
  );
