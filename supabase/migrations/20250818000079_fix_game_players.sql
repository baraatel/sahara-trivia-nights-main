-- Fix game_players table issues
-- This migration addresses the 400 Bad Request error when updating game players

DO $$
BEGIN
  RAISE NOTICE '=== FIXING GAME_PLAYERS TABLE ===';
  RAISE NOTICE 'Addressing 400 Bad Request error when updating game players';
END $$;

-- Check if there are any orphaned game_players records
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.game_players gp
  LEFT JOIN public.games g ON gp.game_id = g.id
  WHERE g.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned game_players records (referencing non-existent games)', orphaned_count;
    
    -- Clean up orphaned records
    DELETE FROM public.game_players gp
    WHERE NOT EXISTS (
      SELECT 1 FROM public.games g WHERE g.id = gp.game_id
    );
    
    RAISE NOTICE 'Cleaned up orphaned game_players records';
  ELSE
    RAISE NOTICE 'No orphaned game_players records found';
  END IF;
END $$;

-- Check if there are any orphaned game_players records with invalid user_id
DO $$
DECLARE
  orphaned_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_user_count
  FROM public.game_players gp
  LEFT JOIN auth.users u ON gp.user_id = u.id
  WHERE u.id IS NULL;
  
  IF orphaned_user_count > 0 THEN
    RAISE NOTICE 'Found % orphaned game_players records (referencing non-existent users)', orphaned_user_count;
    
    -- Clean up orphaned records
    DELETE FROM public.game_players gp
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = gp.user_id
    );
    
    RAISE NOTICE 'Cleaned up orphaned game_players records with invalid users';
  ELSE
    RAISE NOTICE 'No orphaned game_players records with invalid users found';
  END IF;
END $$;

-- Add better constraints to prevent future issues (only if they don't exist)
DO $$
BEGIN
  -- Add foreign key constraint for game_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_players_game_id_fkey' 
    AND table_name = 'game_players'
  ) THEN
    ALTER TABLE public.game_players 
    ADD CONSTRAINT game_players_game_id_fkey 
    FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added game_players_game_id_fkey constraint';
  ELSE
    RAISE NOTICE 'game_players_game_id_fkey constraint already exists';
  END IF;
END $$;

DO $$
BEGIN
  -- Add foreign key constraint for user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_players_user_id_fkey' 
    AND table_name = 'game_players'
  ) THEN
    ALTER TABLE public.game_players 
    ADD CONSTRAINT game_players_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added game_players_user_id_fkey constraint';
  ELSE
    RAISE NOTICE 'game_players_user_id_fkey constraint already exists';
  END IF;
END $$;

DO $$
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_players_game_user_unique' 
    AND table_name = 'game_players'
  ) THEN
    ALTER TABLE public.game_players 
    ADD CONSTRAINT game_players_game_user_unique 
    UNIQUE (game_id, user_id);
    RAISE NOTICE 'Added game_players_game_user_unique constraint';
  ELSE
    RAISE NOTICE 'game_players_game_user_unique constraint already exists';
  END IF;
END $$;

DO $$
BEGIN
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_players_score_check' 
    AND table_name = 'game_players'
  ) THEN
    ALTER TABLE public.game_players 
    ADD CONSTRAINT game_players_score_check 
    CHECK (score >= 0);
    RAISE NOTICE 'Added game_players_score_check constraint';
  ELSE
    RAISE NOTICE 'game_players_score_check constraint already exists';
  END IF;
END $$;

-- Create a function to safely update game player status
CREATE OR REPLACE FUNCTION update_game_player_status(
  p_game_id UUID,
  p_user_id UUID,
  p_score INTEGER DEFAULT NULL,
  p_is_ready BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  record_exists BOOLEAN;
BEGIN
  -- Check if the record exists
  SELECT EXISTS(
    SELECT 1 FROM public.game_players 
    WHERE game_id = p_game_id AND user_id = p_user_id
  ) INTO record_exists;
  
  IF NOT record_exists THEN
    RAISE NOTICE 'Game player record does not exist for game_id: % and user_id: %', p_game_id, p_user_id;
    RETURN FALSE;
  END IF;
  
  -- Update the record
  UPDATE public.game_players 
  SET 
    score = COALESCE(p_score, score),
    is_ready = COALESCE(p_is_ready, is_ready)
  WHERE game_id = p_game_id AND user_id = p_user_id;
  
  RAISE NOTICE 'Successfully updated game player status for game_id: % and user_id: %', p_game_id, p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_game_player_status(UUID, UUID, INTEGER, BOOLEAN) TO authenticated;

-- Test the function
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test with a non-existent record (should return false)
  SELECT update_game_player_status(
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    100,
    true
  ) INTO test_result;
  
  RAISE NOTICE 'Test with non-existent record returned: %', test_result;
  
  RAISE NOTICE 'Game players table has been fixed successfully';
END $$;
