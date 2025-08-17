-- Fix Potential Infinite Recursion in Team-Related Tables
-- This migration fixes potential infinite recursion in team_players, team_games, and team_game_players tables

DO $$
BEGIN
  RAISE NOTICE '=== FIXING TEAM RECURSION ===';
  RAISE NOTICE 'Fixing potential infinite recursion in team-related tables';
END $$;

-- Fix team_players table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view team players for teams they belong to" ON public.team_players;
DROP POLICY IF EXISTS "Team owners can manage team players" ON public.team_players;
DROP POLICY IF EXISTS "Users can join teams" ON public.team_players;

CREATE POLICY "Users can view team players for teams they belong to" ON public.team_players
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_players.team_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Team owners can manage team players" ON public.team_players
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_players.team_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can join teams" ON public.team_players
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix team_games table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view team games for teams they belong to" ON public.team_games;
DROP POLICY IF EXISTS "Team owners can manage team games" ON public.team_games;

CREATE POLICY "Users can view team games for teams they belong to" ON public.team_games
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_games.team_id AND created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.team_players 
    WHERE team_id = team_games.team_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Team owners can manage team games" ON public.team_games
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_games.team_id AND created_by = auth.uid()
  )
);

-- Fix team_game_players table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view team game players for games they participate in" ON public.team_game_players;
DROP POLICY IF EXISTS "Users can join team games" ON public.team_game_players;
DROP POLICY IF EXISTS "Team owners can manage team game players" ON public.team_game_players;

CREATE POLICY "Users can view team game players for games they participate in" ON public.team_game_players
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_games 
    WHERE id = team_game_players.team_game_id AND
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_games.team_id AND created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can join team games" ON public.team_game_players
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team owners can manage team game players" ON public.team_game_players
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.team_games 
    WHERE id = team_game_players.team_game_id AND
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_games.team_id AND created_by = auth.uid()
    )
  )
);

-- Fix team_game_answers table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view team game answers for games they participate in" ON public.team_game_answers;
DROP POLICY IF EXISTS "Users can submit team game answers" ON public.team_game_answers;

CREATE POLICY "Users can view team game answers for games they participate in" ON public.team_game_answers
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_games 
    WHERE id = team_game_answers.team_game_id AND
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = team_games.team_id AND created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can submit team game answers" ON public.team_game_answers
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Test the fix
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing team recursion fix for user: %', test_user_id;
    
    -- Test team_players table access
    RAISE NOTICE 'Testing team_players table access...';
    PERFORM 1 FROM public.team_players WHERE user_id = test_user_id LIMIT 1;
    RAISE NOTICE 'team_players table access successful';
    
    -- Test team_games table access
    RAISE NOTICE 'Testing team_games table access...';
    PERFORM 1 FROM public.team_games LIMIT 1;
    RAISE NOTICE 'team_games table access successful';
    
    -- Test team_game_players table access
    RAISE NOTICE 'Testing team_game_players table access...';
    PERFORM 1 FROM public.team_game_players WHERE user_id = test_user_id LIMIT 1;
    RAISE NOTICE 'team_game_players table access successful';
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '=== TEAM RECURSION FIX COMPLETE ===';
  RAISE NOTICE 'Fixed team-related table RLS policies:';
  RAISE NOTICE '- Removed potential circular dependencies';
  RAISE NOTICE '- Simplified policy logic for team tables';
  RAISE NOTICE '- Maintained security while avoiding recursion';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All potential infinite recursion issues should now be resolved!';
END $$;
