-- Comprehensive fix for all admin access issues
-- This migration ensures admin users can access all data without RLS restrictions

-- Fix users table access for admin components
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    id = auth.uid()
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    id = auth.uid()
  );

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    public.is_admin_user()
  );

-- Fix user_stats table access for admin components
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admins can view all user stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admins can manage all user stats" ON public.user_stats;

CREATE POLICY "Users can view own stats" ON public.user_stats
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own stats" ON public.user_stats
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all user stats" ON public.user_stats
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage all user stats" ON public.user_stats
  FOR ALL USING (
    public.is_admin_user()
  );

-- Fix user_game_purchases table access for admin components
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.user_game_purchases;

CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can create purchases" ON public.user_game_purchases
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all purchases" ON public.user_game_purchases
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage all purchases" ON public.user_game_purchases
  FOR ALL USING (
    public.is_admin_user()
  );

-- Fix code_redemptions table access for admin components
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admins can manage all redemptions" ON public.code_redemptions;

CREATE POLICY "Users can view own redemptions" ON public.code_redemptions
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can create redemptions" ON public.code_redemptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all redemptions" ON public.code_redemptions
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage all redemptions" ON public.code_redemptions
  FOR ALL USING (
    public.is_admin_user()
  );

-- Fix user_category_access table access for admin components
DROP POLICY IF EXISTS "Users can view own category access" ON public.user_category_access;
DROP POLICY IF EXISTS "Users can update own category access" ON public.user_category_access;
DROP POLICY IF EXISTS "Users can insert own category access" ON public.user_category_access;
DROP POLICY IF EXISTS "Admins can view all category access" ON public.user_category_access;
DROP POLICY IF EXISTS "Admins can manage all category access" ON public.user_category_access;

CREATE POLICY "Users can view own category access" ON public.user_category_access
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own category access" ON public.user_category_access
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can insert own category access" ON public.user_category_access
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all category access" ON public.user_category_access
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage all category access" ON public.user_category_access
  FOR ALL USING (
    public.is_admin_user()
  );

-- Fix user_cart table access for admin components
DROP POLICY IF EXISTS "Users can view own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Users can update own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.user_cart;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.user_cart;
DROP POLICY IF EXISTS "Admins can view all carts" ON public.user_cart;
DROP POLICY IF EXISTS "Admins can manage all carts" ON public.user_cart;

CREATE POLICY "Users can view own cart" ON public.user_cart
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own cart" ON public.user_cart
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can insert own cart items" ON public.user_cart
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete own cart items" ON public.user_cart
  FOR DELETE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all carts" ON public.user_cart
  FOR SELECT USING (
    public.is_admin_user()
  );

CREATE POLICY "Admins can manage all carts" ON public.user_cart
  FOR ALL USING (
    public.is_admin_user()
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed all admin access policies across user-related tables';
  RAISE NOTICE 'Admin components should now work without permission issues';
END $$;
