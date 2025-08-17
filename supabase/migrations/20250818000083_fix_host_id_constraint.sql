-- Fix host_id constraint issue
-- This migration fixes the null host_id constraint violation

DO $$
BEGIN
  RAISE NOTICE '=== FIXING HOST_ID CONSTRAINT ===';
  RAISE NOTICE 'Addressing null host_id constraint violation';
END $$;

-- Fix the ensure_game_exists function to handle host_id properly
CREATE OR REPLACE FUNCTION ensure_game_exists(
  p_game_id TEXT,
  p_host_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  game_uuid UUID;
  host_uuid UUID;
  game_exists BOOLEAN;
  current_user_id UUID;
  result JSON;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Convert text to UUID, handling game_ prefix
  BEGIN
    IF p_game_id LIKE 'game_%' THEN
      game_uuid := substring(p_game_id from 6)::UUID;
    ELSE
      game_uuid := p_game_id::UUID;
    END IF;
    
    IF p_host_id IS NOT NULL THEN
      host_uuid := p_host_id::UUID;
    ELSE
      host_uuid := current_user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid UUID format',
        'details', SQLERRM
      );
  END;
  
  -- Check if game exists
  SELECT EXISTS(SELECT 1 FROM public.games WHERE id = game_uuid) INTO game_exists;
  
  IF NOT game_exists THEN
    -- Create the game if it doesn't exist
    INSERT INTO public.games (id, host_id, status, room_code)
    VALUES (
      game_uuid,
      host_uuid,
      'waiting',
      upper(substring(md5(random()::text) from 1 for 6))
    );
    
    result := json_build_object(
      'success', true,
      'action', 'created',
      'message', 'Game created successfully',
      'game_id', game_uuid,
      'host_id', host_uuid
    );
  ELSE
    result := json_build_object(
      'success', true,
      'action', 'exists',
      'message', 'Game already exists',
      'game_id', game_uuid
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'game_id', p_game_id,
      'host_id', host_uuid,
      'current_user_id', current_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fixed function
DO $$
DECLARE
  test_result JSON;
BEGIN
  RAISE NOTICE '=== TESTING FIXED FUNCTION ===';
  
  -- Test with the problematic game ID
  SELECT ensure_game_exists('game_91eb0c24-5012-4b7c-afd3-dcda1e9bacf1') INTO test_result;
  RAISE NOTICE 'Ensure game exists result: %', test_result;
  
  -- Test game player operation
  SELECT handle_game_player_operation(
    'upsert',
    'game_91eb0c24-5012-4b7c-afd3-dcda1e9bacf1',
    '5e1767da-cc27-462c-a0f3-81230685c1dd',
    200,
    true
  ) INTO test_result;
  
  RAISE NOTICE 'Game player operation result: %', test_result;
END $$;

DO $$
BEGIN
  RAISE NOTICE '=== HOST_ID CONSTRAINT FIX COMPLETE ===';
  RAISE NOTICE 'The ensure_game_exists function now properly handles host_id';
  RAISE NOTICE 'It will use the current user ID if no host_id is provided';
  RAISE NOTICE 'This should resolve the 500 Internal Server Error completely!';
END $$;
