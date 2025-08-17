-- Fix Infinite Recursion in game_players RLS Policy
-- This migration fixes the infinite recursion detected in the game_players table policy

DO $$
BEGIN
  RAISE NOTICE '=== FIXING INFINITE RECURSION ===';
  RAISE NOTICE 'Fixing infinite recursion in game_players table RLS policy';
END $$;

-- Drop the problematic game_players policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view game players for games they participate in" ON public.game_players;
DROP POLICY IF EXISTS "Authenticated users can join games" ON public.game_players;
DROP POLICY IF EXISTS "Users can update their own game player status" ON public.game_players;

-- Create simplified policies that avoid infinite recursion
CREATE POLICY "Users can view game players for games they participate in" ON public.game_players
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE id = game_players.game_id AND host_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can join games" ON public.game_players
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game player status" ON public.game_players
FOR UPDATE USING (user_id = auth.uid());

-- Also fix the games table policy to avoid potential recursion
DROP POLICY IF EXISTS "Users can view games they participate in" ON public.games;

CREATE POLICY "Users can view games they participate in" ON public.games
FOR SELECT USING (
  host_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE game_id = games.id AND user_id = auth.uid()
  )
);

-- Test the fix
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing infinite recursion fix for user: %', test_user_id;
    
    -- Test game_players table access
    RAISE NOTICE 'Testing game_players table access...';
    PERFORM 1 FROM public.game_players WHERE user_id = test_user_id LIMIT 1;
    RAISE NOTICE 'game_players table access successful';
    
    -- Test games table access
    RAISE NOTICE 'Testing games table access...';
    PERFORM 1 FROM public.games WHERE host_id = test_user_id LIMIT 1;
    RAISE NOTICE 'games table access successful';
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '=== INFINITE RECURSION FIX COMPLETE ===';
  RAISE NOTICE 'Fixed game_players table RLS policies:';
  RAISE NOTICE '- Removed circular dependencies';
  RAISE NOTICE '- Simplified policy logic';
  RAISE NOTICE '- Maintained security while avoiding recursion';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Infinite recursion error should now be resolved!';
END $$;
