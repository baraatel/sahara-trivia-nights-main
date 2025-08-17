
-- Fix infinite recursion in games table RLS policy
DROP POLICY IF EXISTS "Users can view games they participate in" ON public.games;

CREATE POLICY "Users can view games they participate in" ON public.games
FOR SELECT 
USING (
  host_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM game_players gp 
    WHERE gp.game_id = games.id AND gp.user_id = auth.uid()
  )
);

-- Fix infinite recursion in game_players table RLS policy  
DROP POLICY IF EXISTS "Users can view game players for games they participate in" ON public.game_players;

CREATE POLICY "Users can view game players for games they participate in" ON public.game_players
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = game_players.game_id AND g.host_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM game_players gp
    WHERE gp.game_id = game_players.game_id AND gp.user_id = auth.uid()
  )
);

-- Add Google Pay settings to admin_settings if not exists
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES 
  ('google_pay_merchant_id', ''),
  ('google_pay_gateway_merchant_id', ''),
  ('google_pay_environment', 'TEST')
ON CONFLICT (setting_key) DO NOTHING;
