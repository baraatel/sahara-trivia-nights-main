-- Migration: Add teams system for multiplayer games
-- This migration creates tables and functions for team management

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_players INTEGER NOT NULL DEFAULT 4,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create team_players table
CREATE TABLE IF NOT EXISTS public.team_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create team_games table for team-based games
CREATE TABLE IF NOT EXISTS public.team_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  game_purchase_id UUID REFERENCES public.game_purchases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
  room_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0
);

-- Create team_game_players table
CREATE TABLE IF NOT EXISTS public.team_game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_game_id UUID NOT NULL REFERENCES public.team_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_game_id, user_id)
);

-- Create function to generate team codes
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE team_code = code) INTO exists_already;
    
    -- If code doesn't exist, return it
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate team game room codes
CREATE OR REPLACE FUNCTION generate_team_game_room_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.team_games WHERE room_code = code) INTO exists_already;
    
    -- If code doesn't exist, return it
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get team details with players
CREATE OR REPLACE FUNCTION get_team_details(team_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  max_players INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  team_code TEXT,
  is_active BOOLEAN,
  player_count BIGINT,
  captain_name TEXT,
  captain_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.description,
    t.max_players,
    t.created_by,
    t.created_at,
    t.team_code,
    t.is_active,
    COUNT(tp.id) as player_count,
    u.full_name as captain_name,
    u.username as captain_username
  FROM public.teams t
  LEFT JOIN public.team_players tp ON t.id = tp.team_id
  LEFT JOIN public.users u ON t.created_by = u.id
  WHERE t.id = team_id_param
  GROUP BY t.id, t.name, t.description, t.max_players, t.created_by, t.created_at, t.team_code, t.is_active, u.full_name, u.username;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  max_players INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  team_code TEXT,
  is_active BOOLEAN,
  role TEXT,
  player_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.description,
    t.max_players,
    t.created_by,
    t.created_at,
    t.team_code,
    t.is_active,
    tp.role,
    COUNT(tp2.id) as player_count
  FROM public.teams t
  JOIN public.team_players tp ON t.id = tp.team_id
  LEFT JOIN public.team_players tp2 ON t.id = tp2.team_id
  WHERE tp.user_id = user_id_param
  GROUP BY t.id, t.name, t.description, t.max_players, t.created_by, t.created_at, t.team_code, t.is_active, tp.role;
END;
$$ LANGUAGE plpgsql;

-- Create function to create team game
CREATE OR REPLACE FUNCTION create_team_game(
  team_id_param UUID,
  created_by_param UUID,
  game_purchase_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  team_game_id UUID;
  room_code TEXT;
BEGIN
  -- Generate room code
  SELECT generate_team_game_room_code() INTO room_code;
  
  -- Create team game
  INSERT INTO public.team_games (
    team_id,
    game_purchase_id,
    room_code,
    created_by
  ) VALUES (
    team_id_param,
    game_purchase_id_param,
    room_code,
    created_by_param
  ) RETURNING id INTO team_game_id;
  
  -- Add all team members to the game
  INSERT INTO public.team_game_players (
    team_game_id,
    user_id,
    team_id
  )
  SELECT 
    team_game_id,
    tp.user_id,
    tp.team_id
  FROM public.team_players tp
  WHERE tp.team_id = team_id_param;
  
  RETURN team_game_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_team_code ON public.teams(team_code);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_user_id ON public.team_players(user_id);
CREATE INDEX IF NOT EXISTS idx_team_games_team_id ON public.team_games(team_id);
CREATE INDEX IF NOT EXISTS idx_team_games_room_code ON public.team_games(room_code);
CREATE INDEX IF NOT EXISTS idx_team_game_players_team_game_id ON public.team_game_players(team_game_id);

-- Create RLS policies for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_game_players ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they are members of" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_players 
      WHERE team_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Team captains can update their teams" ON public.teams
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Team captains can delete their teams" ON public.teams
  FOR DELETE USING (created_by = auth.uid());

-- Team players policies
CREATE POLICY "Users can view team players for teams they are in" ON public.team_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_players tp2
      WHERE tp2.team_id = team_id AND tp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Team captains can add players" ON public.team_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join teams with valid codes" ON public.team_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND team_code IS NOT NULL
    )
  );

CREATE POLICY "Team captains can remove players" ON public.team_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND created_by = auth.uid()
    )
  );

-- Team games policies
CREATE POLICY "Users can view team games they are in" ON public.team_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_game_players
      WHERE team_game_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create team games for their teams" ON public.team_games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_players
      WHERE team_id = team_id AND user_id = auth.uid()
    )
  );

-- Team game players policies
CREATE POLICY "Users can view team game players for games they are in" ON public.team_game_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_game_players tgp2
      WHERE tgp2.team_game_id = team_game_id AND tgp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join team games" ON public.team_game_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_players
      WHERE team_id = team_id AND user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_team_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_team_game_room_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_game(UUID, UUID, UUID) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_games TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_game_players TO authenticated;

-- Add comments
COMMENT ON TABLE public.teams IS 'جدول الفرق - يحتوي على معلومات الفرق وأعضائها';
COMMENT ON TABLE public.team_players IS 'جدول أعضاء الفرق - يربط المستخدمين بالفرق';
COMMENT ON TABLE public.team_games IS 'جدول ألعاب الفرق - يحتوي على معلومات ألعاب الفرق';
COMMENT ON TABLE public.team_game_players IS 'جدول لاعبين ألعاب الفرق - يربط اللاعبين بألعاب الفرق';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Teams system created successfully.';
  RAISE NOTICE 'Created tables: teams, team_players, team_games, team_game_players';
  RAISE NOTICE 'Created functions: generate_team_code, generate_team_game_room_code, get_team_details, get_user_teams, create_team_game';
END $$;
