
-- Fix infinite recursion in RLS policies by using security definer functions
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view games they participate in" ON public.games;
DROP POLICY IF EXISTS "Users can view game players for games they participate in" ON public.game_players;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.user_can_view_game(game_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = game_id AND g.host_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM game_players gp 
    WHERE gp.game_id = game_id AND gp.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_can_view_game_players(target_game_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = target_game_id AND g.host_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM game_players gp 
    WHERE gp.game_id = target_game_id AND gp.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies using the security definer functions
CREATE POLICY "Users can view games they participate in" ON public.games
FOR SELECT USING (public.user_can_view_game(id));

CREATE POLICY "Users can view game players for games they participate in" ON public.game_players
FOR SELECT USING (public.user_can_view_game_players(game_id));

-- Create shopping cart table
CREATE TABLE IF NOT EXISTS public.user_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS on user_cart
ALTER TABLE public.user_cart ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_cart
CREATE POLICY "Users can view their own cart" ON public.user_cart
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart" ON public.user_cart
FOR ALL USING (auth.uid() = user_id);

-- Create redemption codes table
CREATE TABLE IF NOT EXISTS public.redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('category', 'credits', 'premium')),
  value_type TEXT NOT NULL,
  value_data JSONB NOT NULL,
  usage_limit INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on redemption_codes
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for redemption_codes
CREATE POLICY "Admin can manage redemption codes" ON public.redemption_codes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

CREATE POLICY "Users can view active codes for redemption" ON public.redemption_codes
FOR SELECT USING (is_active = true AND usage_count < usage_limit AND (expires_at IS NULL OR expires_at > now()));

-- Create code redemption history table
CREATE TABLE IF NOT EXISTS public.code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES redemption_codes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- Enable RLS on code_redemptions
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for code_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.code_redemptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions" ON public.code_redemptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all redemptions" ON public.code_redemptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Create leaderboard view for better performance
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  u.id,
  u.username,
  u.full_name,
  us.total_score,
  us.games_played,
  us.correct_answers,
  us.questions_answered,
  CASE 
    WHEN us.questions_answered > 0 
    THEN ROUND((us.correct_answers::DECIMAL / us.questions_answered) * 100, 2)
    ELSE 0
  END as accuracy_percentage,
  ROW_NUMBER() OVER (ORDER BY us.total_score DESC) as rank
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.total_score > 0
ORDER BY us.total_score DESC;

-- Function to generate unique redemption codes
CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT AS $$
DECLARE
  code_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(code_chars, floor(random() * length(code_chars) + 1)::INTEGER, 1);
  END LOOP;
  
  -- Add dashes for readability: XXXX-XXXX
  result := substr(result, 1, 4) || '-' || substr(result, 5, 4);
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM redemption_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(code_chars, floor(random() * length(code_chars) + 1)::INTEGER, 1);
    END LOOP;
    result := substr(result, 1, 4) || '-' || substr(result, 5, 4);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
