-- Migration: Fix remaining permission issues for user_stats, user_game_purchases, and code_redemptions
-- This migration ensures proper access to all user-related tables

-- Fix user_stats table RLS policies
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can view all stats" ON public.user_stats;
DROP POLICY IF EXISTS "Admin can manage all stats" ON public.user_stats;

CREATE POLICY "Users can view own stats" ON public.user_stats
FOR SELECT USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can insert own stats" ON public.user_stats
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (
  is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can manage all stats" ON public.user_stats
FOR ALL USING (
  is_admin_user(auth.jwt() ->> 'email')
);

-- Fix user_game_purchases table RLS policies (if table exists)
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can make purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can manage all purchases" ON public.user_game_purchases;

CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can update own purchases" ON public.user_game_purchases
FOR UPDATE USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (
  is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can manage all purchases" ON public.user_game_purchases
FOR ALL USING (
  is_admin_user(auth.jwt() ->> 'email')
);

-- Fix code_redemptions table RLS policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Users can create redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can view all redemptions" ON public.code_redemptions;
DROP POLICY IF EXISTS "Admin can manage all redemptions" ON public.code_redemptions;

CREATE POLICY "Users can view own redemptions" ON public.code_redemptions
FOR SELECT USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can create redemptions" ON public.code_redemptions
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can update own redemptions" ON public.code_redemptions
FOR UPDATE USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can view all redemptions" ON public.code_redemptions
FOR SELECT USING (
  is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can manage all redemptions" ON public.code_redemptions
FOR ALL USING (
  is_admin_user(auth.jwt() ->> 'email')
);

-- Fix user_cart table RLS policies (if it exists)
DROP POLICY IF EXISTS "Users can view own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.user_cart;
DROP POLICY IF EXISTS "Admin can view all carts" ON public.user_cart;
DROP POLICY IF EXISTS "Admin can manage all carts" ON public.user_cart;

CREATE POLICY "Users can view own cart" ON public.user_cart
FOR SELECT USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Users can manage own cart" ON public.user_cart
FOR ALL USING (
  user_id = auth.uid() OR is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can view all carts" ON public.user_cart
FOR SELECT USING (
  is_admin_user(auth.jwt() ->> 'email')
);

CREATE POLICY "Admin can manage all carts" ON public.user_cart
FOR ALL USING (
  is_admin_user(auth.jwt() ->> 'email')
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for user_stats, user_game_purchases, code_redemptions, and user_cart tables';
  RAISE NOTICE 'Users can now access their own data and admins have full access';
END $$;
