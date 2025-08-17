-- Migration: Create real games and team_games tables
-- This migration creates proper game and team_game records for multiplayer functionality

-- Add game_purchase_id column to existing games table if it doesn't exist
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS game_purchase_id UUID REFERENCES public.game_purchases(id) ON DELETE CASCADE;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS game_type TEXT CHECK (game_type IN ('individual', 'team'));
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS current_players INTEGER DEFAULT 1;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create team_games table for team game sessions
CREATE TABLE IF NOT EXISTS public.team_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_purchase_id UUID NOT NULL REFERENCES public.game_purchases(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  team1_name TEXT DEFAULT 'الفريق الأول',
  team2_name TEXT DEFAULT 'الفريق الثاني',
  max_players_per_team INTEGER DEFAULT 3,
  team1_players INTEGER DEFAULT 0,
  team2_players INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'game_purchase_id') THEN
    CREATE INDEX IF NOT EXISTS idx_games_game_purchase_id ON public.games(game_purchase_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'host_id') THEN
    CREATE INDEX IF NOT EXISTS idx_games_host_id ON public.games(host_id);
  END IF;
  
  CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
  CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at);
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_games' AND column_name = 'game_purchase_id') THEN
    CREATE INDEX IF NOT EXISTS idx_team_games_game_purchase_id ON public.team_games(game_purchase_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_games' AND column_name = 'host_id') THEN
    CREATE INDEX IF NOT EXISTS idx_team_games_host_id ON public.team_games(host_id);
  END IF;
  
  CREATE INDEX IF NOT EXISTS idx_team_games_status ON public.team_games(status);
  CREATE INDEX IF NOT EXISTS idx_team_games_created_at ON public.team_games(created_at);
END $$;

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_games ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for games (drop existing ones first)
DROP POLICY IF EXISTS "Users can view games they participate in" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Game hosts can update their games" ON public.games;

CREATE POLICY "Users can view games they participate in" ON public.games
  FOR SELECT USING (
    host_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.game_players WHERE game_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create games" ON public.games
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Game hosts can update their games" ON public.games
  FOR UPDATE USING (host_id = auth.uid());

-- Create RLS policies for team_games (only if host_id column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_games' AND column_name = 'host_id') THEN
    DROP POLICY IF EXISTS "Users can view team games they participate in" ON public.team_games;
    DROP POLICY IF EXISTS "Authenticated users can create team games" ON public.team_games;
    DROP POLICY IF EXISTS "Team game hosts can update their games" ON public.team_games;

    CREATE POLICY "Users can view team games they participate in" ON public.team_games
      FOR SELECT USING (
        host_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.team_game_players WHERE team_game_id = id AND user_id = auth.uid())
      );

    CREATE POLICY "Authenticated users can create team games" ON public.team_games
      FOR INSERT WITH CHECK (auth.uid() = host_id);

    CREATE POLICY "Team game hosts can update their games" ON public.team_games
      FOR UPDATE USING (host_id = auth.uid());
  END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.games TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.team_games TO authenticated;

-- Create function to create a game from a game purchase
CREATE OR REPLACE FUNCTION create_game_from_purchase(
  purchase_id UUID,
  game_type_param TEXT DEFAULT 'individual',
  max_players_param INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  new_game_id UUID;
  user_id UUID;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if game purchase exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.game_purchases 
    WHERE id = purchase_id AND user_id = user_id
  ) THEN
    RAISE EXCEPTION 'Game purchase not found or does not belong to user';
  END IF;
  
  -- Create game based on type
  IF game_type_param = 'team' THEN
    INSERT INTO public.team_games (game_purchase_id, host_id, max_players_per_team)
    VALUES (purchase_id, user_id, max_players_param)
    RETURNING id INTO new_game_id;
  ELSE
    INSERT INTO public.games (game_purchase_id, host_id, game_type, max_players)
    VALUES (purchase_id, user_id, game_type_param, max_players_param)
    RETURNING id INTO new_game_id;
  END IF;
  
  RETURN new_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to start a game
CREATE OR REPLACE FUNCTION start_game(game_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  game_record RECORD;
  team_game_record RECORD;
BEGIN
  -- Try to find regular game
  SELECT * INTO game_record FROM public.games WHERE id = game_id_param;
  
  IF game_record.id IS NOT NULL THEN
    -- Update regular game
    UPDATE public.games 
    SET status = 'active', started_at = NOW()
    WHERE id = game_id_param AND host_id = auth.uid();
    
    RETURN FOUND;
  END IF;
  
  -- Try to find team game
  SELECT * INTO team_game_record FROM public.team_games WHERE id = game_id_param;
  
  IF team_game_record.id IS NOT NULL THEN
    -- Update team game
    UPDATE public.team_games 
    SET status = 'active', started_at = NOW()
    WHERE id = game_id_param AND host_id = auth.uid();
    
    RETURN FOUND;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to finish a game
CREATE OR REPLACE FUNCTION finish_game(game_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  game_record RECORD;
  team_game_record RECORD;
BEGIN
  -- Try to find regular game
  SELECT * INTO game_record FROM public.games WHERE id = game_id_param;
  
  IF game_record.id IS NOT NULL THEN
    -- Update regular game
    UPDATE public.games 
    SET status = 'finished', finished_at = NOW()
    WHERE id = game_id_param AND host_id = auth.uid();
    
    RETURN FOUND;
  END IF;
  
  -- Try to find team game
  SELECT * INTO team_game_record FROM public.team_games WHERE id = game_id_param;
  
  IF team_game_record.id IS NOT NULL THEN
    -- Update team game
    UPDATE public.team_games 
    SET status = 'finished', finished_at = NOW()
    WHERE id = game_id_param AND host_id = auth.uid();
    
    RETURN FOUND;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION create_game_from_purchase(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION finish_game(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE public.games IS 'جدول الألعاب الفردية والجماعية';
COMMENT ON TABLE public.team_games IS 'جدول ألعاب الفرق';
COMMENT ON COLUMN public.games.game_purchase_id IS 'معرف شراء اللعبة';
COMMENT ON COLUMN public.games.host_id IS 'معرف المضيف';
COMMENT ON COLUMN public.games.game_type IS 'نوع اللعبة (individual أو team)';
COMMENT ON COLUMN public.games.status IS 'حالة اللعبة (waiting, active, finished, cancelled)';
COMMENT ON COLUMN public.games.max_players IS 'الحد الأقصى للاعبين';
COMMENT ON COLUMN public.games.current_players IS 'عدد اللاعبين الحاليين';

COMMENT ON COLUMN public.team_games.game_purchase_id IS 'معرف شراء اللعبة';
-- COMMENT ON COLUMN public.team_games.host_id IS 'معرف المضيف';
-- COMMENT ON COLUMN public.team_games.team1_name IS 'اسم الفريق الأول';
-- COMMENT ON COLUMN public.team_games.team2_name IS 'اسم الفريق الثاني';
-- COMMENT ON COLUMN public.team_games.max_players_per_team IS 'الحد الأقصى للاعبين في كل فريق';
-- COMMENT ON COLUMN public.team_games.team1_players IS 'عدد اللاعبين في الفريق الأول';
-- COMMENT ON COLUMN public.team_games.team2_players IS 'عدد اللاعبين في الفريق الثاني';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Created real games and team_games tables.';
  RAISE NOTICE 'Created tables: games, team_games';
  RAISE NOTICE 'Created functions: create_game_from_purchase, start_game, finish_game';
END $$;
