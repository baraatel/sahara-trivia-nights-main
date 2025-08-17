-- Final Game Players Fix - Handle Non-existent Games Gracefully
-- This migration provides a complete solution for the game_players PATCH error

DO $$
BEGIN
  RAISE NOTICE '=== FINAL GAME PLAYERS FIX ===';
  RAISE NOTICE 'Handling non-existent games gracefully';
END $$;

-- Create a comprehensive function to handle game_players operations
CREATE OR REPLACE FUNCTION handle_game_player_operation(
  p_operation TEXT, -- 'insert', 'update', 'upsert', 'delete'
  p_game_id TEXT,
  p_user_id TEXT,
  p_score INTEGER DEFAULT NULL,
  p_is_ready BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  game_uuid UUID;
  user_uuid UUID;
  game_exists BOOLEAN;
  user_exists BOOLEAN;
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
      RETURN json_build_object(
        'success', false, 
        'error', 'Invalid UUID format',
        'details', SQLERRM
      );
  END;
  
  -- Check if game exists
  SELECT EXISTS(SELECT 1 FROM public.games WHERE id = game_uuid) INTO game_exists;
  IF NOT game_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Game does not exist',
      'game_id', p_game_id,
      'game_uuid', game_uuid,
      'suggestion', 'Create the game first or use a valid game ID'
    );
  END IF;
  
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) INTO user_exists;
  IF NOT user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User does not exist',
      'user_id', p_user_id,
      'suggestion', 'Use a valid user ID'
    );
  END IF;
  
  -- Check if record exists
  SELECT EXISTS(
    SELECT 1 FROM public.game_players 
    WHERE game_id = game_uuid AND user_id = user_uuid
  ) INTO record_exists;
  
  -- Handle different operations
  CASE p_operation
    WHEN 'insert' THEN
      IF record_exists THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Game player record already exists',
          'suggestion', 'Use update or upsert operation'
        );
      ELSE
        INSERT INTO public.game_players (game_id, user_id, score, is_ready)
        VALUES (game_uuid, user_uuid, COALESCE(p_score, 0), COALESCE(p_is_ready, false));
        
        result := json_build_object(
          'success', true,
          'action', 'inserted',
          'message', 'Game player record created successfully'
        );
      END IF;
      
    WHEN 'update' THEN
      IF NOT record_exists THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Game player record does not exist',
          'suggestion', 'Use insert or upsert operation'
        );
      ELSE
        UPDATE public.game_players 
        SET 
          score = COALESCE(p_score, score),
          is_ready = COALESCE(p_is_ready, is_ready)
        WHERE game_id = game_uuid AND user_id = user_uuid;
        
        result := json_build_object(
          'success', true,
          'action', 'updated',
          'message', 'Game player record updated successfully'
        );
      END IF;
      
    WHEN 'upsert' THEN
      IF record_exists THEN
        UPDATE public.game_players 
        SET 
          score = COALESCE(p_score, score),
          is_ready = COALESCE(p_is_ready, is_ready)
        WHERE game_id = game_uuid AND user_id = user_uuid;
        
        result := json_build_object(
          'success', true,
          'action', 'updated',
          'message', 'Game player record updated successfully'
        );
      ELSE
        INSERT INTO public.game_players (game_id, user_id, score, is_ready)
        VALUES (game_uuid, user_uuid, COALESCE(p_score, 0), COALESCE(p_is_ready, false));
        
        result := json_build_object(
          'success', true,
          'action', 'inserted',
          'message', 'Game player record created successfully'
        );
      END IF;
      
    WHEN 'delete' THEN
      IF NOT record_exists THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Game player record does not exist'
        );
      ELSE
        DELETE FROM public.game_players 
        WHERE game_id = game_uuid AND user_id = user_uuid;
        
        result := json_build_object(
          'success', true,
          'action', 'deleted',
          'message', 'Game player record deleted successfully'
        );
      END IF;
      
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid operation',
        'valid_operations', 'insert, update, upsert, delete'
      );
  END CASE;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'operation', p_operation,
      'game_id', p_game_id,
      'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION handle_game_player_operation(TEXT, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

-- Create a function to auto-create games if they don't exist
CREATE OR REPLACE FUNCTION ensure_game_exists(
  p_game_id TEXT,
  p_host_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  game_uuid UUID;
  host_uuid UUID;
  game_exists BOOLEAN;
  result JSON;
BEGIN
  -- Convert text to UUID, handling game_ prefix
  BEGIN
    IF p_game_id LIKE 'game_%' THEN
      game_uuid := substring(p_game_id from 6)::UUID;
    ELSE
      game_uuid := p_game_id::UUID;
    END IF;
    
    IF p_host_id IS NOT NULL THEN
      host_uuid := p_host_id::UUID;
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
      COALESCE(host_uuid, auth.uid()),
      'waiting',
      upper(substring(md5(random()::text) from 1 for 6))
    );
    
    result := json_build_object(
      'success', true,
      'action', 'created',
      'message', 'Game created successfully',
      'game_id', game_uuid
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
      'game_id', p_game_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION ensure_game_exists(TEXT, TEXT) TO authenticated;

-- Test the functions
DO $$
DECLARE
  test_result JSON;
BEGIN
  RAISE NOTICE '=== TESTING GAME PLAYERS FUNCTIONS ===';
  
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
  RAISE NOTICE '=== FINAL GAME PLAYERS FIX COMPLETE ===';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '- handle_game_player_operation: Comprehensive game player operations';
  RAISE NOTICE '- ensure_game_exists: Auto-create games if they don''t exist';
  RAISE NOTICE '';
  RAISE NOTICE 'These functions will handle:';
  RAISE NOTICE '- Non-existent games (auto-create or return error)';
  RAISE NOTICE '- Non-existent users (return error)';
  RAISE NOTICE '- Invalid UUIDs (return error)';
  RAISE NOTICE '- All CRUD operations (insert, update, upsert, delete)';
  RAISE NOTICE '';
  RAISE NOTICE 'The 500 Internal Server Error should now be resolved!';
END $$;
