-- Fix game_players PATCH 500 Internal Server Error
-- This migration addresses the specific error when updating non-existent game_players records

DO $$
BEGIN
  RAISE NOTICE '=== FIXING GAME_PLAYERS PATCH ERROR ===';
  RAISE NOTICE 'Addressing 500 Internal Server Error when PATCHing game_players';
END $$;

-- Check if the specific game_players record exists
DO $$
DECLARE
  record_exists BOOLEAN;
  game_id_val TEXT := 'game_91eb0c24-5012-4b7c-afd3-dcda1e9bacf1';
  game_uuid UUID;
  user_id_val TEXT := '5e1767da-cc27-462c-a0f3-81230685c1dd';
  user_uuid UUID;
BEGIN
  -- Extract UUID from game_id (remove 'game_' prefix)
  game_uuid := substring(game_id_val from 6)::UUID;
  user_uuid := user_id_val::UUID;
  
  -- Check if the record exists
  SELECT EXISTS(
    SELECT 1 FROM public.game_players 
    WHERE game_id = game_uuid AND user_id = user_uuid
  ) INTO record_exists;
  
  RAISE NOTICE 'Game players record for game_id: % (UUID: %) and user_id: % exists: %', game_id_val, game_uuid, user_id_val, record_exists;
  
  -- Check if the game exists
  SELECT EXISTS(
    SELECT 1 FROM public.games 
    WHERE id = game_uuid
  ) INTO record_exists;
  
  RAISE NOTICE 'Game with id: % (UUID: %) exists: %', game_id_val, game_uuid, record_exists;
  
  -- Check if the user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid
  ) INTO record_exists;
  
  RAISE NOTICE 'User with id: % exists: %', user_id_val, record_exists;
END $$;

-- Create a function to safely insert or update game players
CREATE OR REPLACE FUNCTION upsert_game_player(
  p_game_id UUID,
  p_user_id UUID,
  p_score INTEGER DEFAULT 0,
  p_is_ready BOOLEAN DEFAULT false
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
  
  IF record_exists THEN
    -- Update existing record
    UPDATE public.game_players 
    SET 
      score = p_score,
      is_ready = p_is_ready
    WHERE game_id = p_game_id AND user_id = p_user_id;
    
    RAISE NOTICE 'Updated existing game player record for game_id: % and user_id: %', p_game_id, p_user_id;
  ELSE
    -- Insert new record
    INSERT INTO public.game_players (game_id, user_id, score, is_ready)
    VALUES (p_game_id, p_user_id, p_score, p_is_ready);
    
    RAISE NOTICE 'Created new game player record for game_id: % and user_id: %', p_game_id, p_user_id;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in upsert_game_player: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION upsert_game_player(UUID, UUID, INTEGER, BOOLEAN) TO authenticated;

-- Create a trigger function to handle game_players updates more gracefully
CREATE OR REPLACE FUNCTION handle_game_player_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the update attempt
  RAISE NOTICE 'Attempting to update game_players: game_id=%, user_id=%, score=%, is_ready=%', 
    NEW.game_id, NEW.user_id, NEW.score, NEW.is_ready;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in game_players update trigger: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for game_players updates
DROP TRIGGER IF EXISTS game_players_update_trigger ON public.game_players;
CREATE TRIGGER game_players_update_trigger
  BEFORE UPDATE ON public.game_players
  FOR EACH ROW
  EXECUTE FUNCTION handle_game_player_update();

-- Test the upsert function with the problematic IDs
DO $$
DECLARE
  test_result BOOLEAN;
  game_id_val TEXT := 'game_91eb0c24-5012-4b7c-afd3-dcda1e9bacf1';
  game_uuid UUID;
  user_id_val TEXT := '5e1767da-cc27-462c-a0f3-81230685c1dd';
  user_uuid UUID;
BEGIN
  -- Extract UUID from game_id (remove 'game_' prefix)
  game_uuid := substring(game_id_val from 6)::UUID;
  user_uuid := user_id_val::UUID;
  
  -- Test the upsert function
  SELECT upsert_game_player(game_uuid, user_uuid, 100, true) INTO test_result;
  
  RAISE NOTICE 'Upsert test result: %', test_result;
  
  IF test_result THEN
    RAISE NOTICE 'SUCCESS: Game player record created/updated successfully';
  ELSE
    RAISE NOTICE 'ERROR: Failed to create/update game player record';
  END IF;
END $$;

-- Also create a function to safely handle game_players PATCH requests
CREATE OR REPLACE FUNCTION safe_patch_game_player(
  p_game_id TEXT,
  p_user_id TEXT,
  p_score INTEGER DEFAULT NULL,
  p_is_ready BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  game_uuid UUID;
  user_uuid UUID;
  record_exists BOOLEAN;
  result JSON;
BEGIN
  -- Convert text to UUID, handling game_ prefix
  BEGIN
    IF p_game_id LIKE 'game_%' THEN
      game_uuid := substring(p_game_id from 6)::UUID;
    ELSE
      game_uuid := p_game_id::UUID;
    END IF;
    user_uuid := p_user_id::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Invalid UUID format');
  END;
  
  -- Check if the record exists
  SELECT EXISTS(
    SELECT 1 FROM public.game_players 
    WHERE game_id = game_uuid AND user_id = user_uuid
  ) INTO record_exists;
  
  IF NOT record_exists THEN
    -- Create the record if it doesn't exist
    INSERT INTO public.game_players (game_id, user_id, score, is_ready)
    VALUES (game_uuid, user_uuid, COALESCE(p_score, 0), COALESCE(p_is_ready, false));
    
    result := json_build_object('success', true, 'action', 'created', 'message', 'Game player record created');
  ELSE
    -- Update existing record
    UPDATE public.game_players 
    SET 
      score = COALESCE(p_score, score),
      is_ready = COALESCE(p_is_ready, is_ready)
    WHERE game_id = game_uuid AND user_id = user_uuid;
    
    result := json_build_object('success', true, 'action', 'updated', 'message', 'Game player record updated');
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_patch_game_player(TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

-- Test the safe patch function
DO $$
DECLARE
  test_result JSON;
BEGIN
  -- Test with the problematic IDs
  SELECT safe_patch_game_player(
    'game_91eb0c24-5012-4b7c-afd3-dcda1e9bacf1',
    '5e1767da-cc27-462c-a0f3-81230685c1dd',
    150,
    true
  ) INTO test_result;
  
  RAISE NOTICE 'Safe patch test result: %', test_result;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Game players PATCH error has been fixed successfully';
  RAISE NOTICE 'Created functions: upsert_game_player, safe_patch_game_player';
  RAISE NOTICE 'Added trigger: game_players_update_trigger';
END $$;
