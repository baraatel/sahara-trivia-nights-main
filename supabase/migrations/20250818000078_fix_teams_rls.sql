-- Fix teams table RLS policies
-- This migration addresses the 500 Internal Server Error when fetching teams data

-- First, let's check the current state
DO $$
BEGIN
  RAISE NOTICE '=== FIXING TEAMS RLS POLICIES ===';
  RAISE NOTICE 'Addressing 500 Internal Server Error when fetching teams data';
END $$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view teams they are members of" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team captains can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team captains can delete their teams" ON public.teams;

DROP POLICY IF EXISTS "Users can view team players for teams they are in" ON public.team_players;
DROP POLICY IF EXISTS "Team captains can add players" ON public.team_players;
DROP POLICY IF EXISTS "Users can join teams with valid codes" ON public.team_players;
DROP POLICY IF EXISTS "Team captains can remove players" ON public.team_players;

-- Create simplified and working RLS policies for teams
CREATE POLICY "Users can view teams they are members of" ON public.teams
  FOR SELECT USING (
    created_by = auth.uid() OR
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

-- Create simplified and working RLS policies for team_players
CREATE POLICY "Users can view team players for teams they are in" ON public.team_players
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND created_by = auth.uid()
    ) OR
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

-- Also fix game_players table RLS policies that might be causing the 400 Bad Request
DROP POLICY IF EXISTS "Users can view game players for games they participate in" ON public.game_players;
DROP POLICY IF EXISTS "Authenticated users can join games" ON public.game_players;
DROP POLICY IF EXISTS "Users can update their own game player status" ON public.game_players;

CREATE POLICY "Users can view game players for games they participate in" ON public.game_players
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.games
      WHERE id = game_id AND host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.game_players gp2
      WHERE gp2.game_id = game_id AND gp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join games" ON public.game_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game player status" ON public.game_players
  FOR UPDATE USING (user_id = auth.uid());

-- Test the policies
DO $$
DECLARE
  test_user_id UUID;
  test_team_count INTEGER;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test teams access
    SELECT COUNT(*) INTO test_team_count
    FROM public.teams
    WHERE created_by = test_user_id;
    
    RAISE NOTICE 'Test user can access % teams they created', test_team_count;
    
    -- Test team_players access
    SELECT COUNT(*) INTO test_team_count
    FROM public.team_players
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Test user can access % team_players records', test_team_count;
  END IF;
  
  RAISE NOTICE 'Teams RLS policies have been fixed successfully';
END $$;
