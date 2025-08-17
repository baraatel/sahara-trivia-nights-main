-- Migration: Fix game_purchases table RLS policies
-- This migration ensures proper access to game_purchases table for users and admins

-- Drop existing policies on game_purchases table
DROP POLICY IF EXISTS "Users can view own game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Users can create game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Users can update own game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Admin can view all game purchases" ON public.game_purchases;
DROP POLICY IF EXISTS "Admin can manage all game purchases" ON public.game_purchases;

-- Create new policies for game_purchases table
CREATE POLICY "Users can view own game purchases" ON public.game_purchases
FOR SELECT USING (
  user_id = auth.uid() OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Users can create game purchases" ON public.game_purchases
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Users can update own game purchases" ON public.game_purchases
FOR UPDATE USING (
  user_id = auth.uid() OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can view all game purchases" ON public.game_purchases
FOR SELECT USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can manage all game purchases" ON public.game_purchases
FOR ALL USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Also fix user_game_purchases table policies if they exist
DROP POLICY IF EXISTS "Users can view own purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Users can make purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can view all purchases" ON public.user_game_purchases;
DROP POLICY IF EXISTS "Admin can manage all purchases" ON public.user_game_purchases;

CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (
  user_id = auth.uid() OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR 
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

CREATE POLICY "Admin can manage all purchases" ON public.user_game_purchases
FOR ALL USING (
  (auth.jwt() ->> 'email') IN ('admin@gmail.com', 'baraatel@gmail.com')
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for game_purchases and user_game_purchases tables';
  RAISE NOTICE 'Users can now access their own purchases and admins have full access';
END $$;
