-- Fix Game ID Prefix Issue
-- This migration fixes any existing game IDs that have the 'game_' prefix

DO $$
BEGIN
  RAISE NOTICE '=== FIXING GAME ID PREFIX ===';
  RAISE NOTICE 'Fixing any existing game IDs with game_ prefix';
END $$;

-- Create a function to clean up game IDs with prefix
CREATE OR REPLACE FUNCTION fix_game_id_prefix()
RETURNS VOID AS $$
DECLARE
  game_record RECORD;
  clean_id UUID;
BEGIN
  -- Check if there are any game_players records with game_id containing 'game_' prefix
  FOR game_record IN 
    SELECT DISTINCT game_id::TEXT as game_id_text
    FROM public.game_players 
    WHERE game_id::TEXT LIKE 'game_%'
  LOOP
    -- Extract the UUID part after 'game_' prefix
    clean_id := substring(game_record.game_id_text from 6)::UUID;
    
    -- Update the game_players table
    UPDATE public.game_players 
    SET game_id = clean_id 
    WHERE game_id::TEXT = game_record.game_id_text;
    
    RAISE NOTICE 'Fixed game_id: % -> %', game_record.game_id_text, clean_id;
  END LOOP;
  
  -- Check if there are any games records with id containing 'game_' prefix
  FOR game_record IN 
    SELECT id::TEXT as id_text
    FROM public.games 
    WHERE id::TEXT LIKE 'game_%'
  LOOP
    -- Extract the UUID part after 'game_' prefix
    clean_id := substring(game_record.id_text from 6)::UUID;
    
    -- Update the games table
    UPDATE public.games 
    SET id = clean_id 
    WHERE id::TEXT = game_record.id_text;
    
    RAISE NOTICE 'Fixed game id: % -> %', game_record.id_text, clean_id;
  END LOOP;
  
  -- Check if there are any game_answers records with game_id containing 'game_' prefix
  FOR game_record IN 
    SELECT DISTINCT game_id::TEXT as game_id_text
    FROM public.game_answers 
    WHERE game_id::TEXT LIKE 'game_%'
  LOOP
    -- Extract the UUID part after 'game_' prefix
    clean_id := substring(game_record.game_id_text from 6)::UUID;
    
    -- Update the game_answers table
    UPDATE public.game_answers 
    SET game_id = clean_id 
    WHERE game_id::TEXT = game_record.game_id_text;
    
    RAISE NOTICE 'Fixed game_answers game_id: % -> %', game_record.game_id_text, clean_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix any existing data
SELECT fix_game_id_prefix();

-- Drop the function after use
DROP FUNCTION fix_game_id_prefix();

-- Create a function to validate UUID format
CREATE OR REPLACE FUNCTION validate_game_id_format()
RETURNS TABLE (
  table_name TEXT,
  invalid_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'game_players'::TEXT, COUNT(*)::BIGINT
  FROM public.game_players 
  WHERE game_id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  UNION ALL
  SELECT 'games'::TEXT, COUNT(*)::BIGINT
  FROM public.games 
  WHERE id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  UNION ALL
  SELECT 'game_answers'::TEXT, COUNT(*)::BIGINT
  FROM public.game_answers 
  WHERE game_id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql;

-- Test the fix
DO $$
DECLARE
  validation_result RECORD;
BEGIN
  RAISE NOTICE '=== VALIDATING GAME ID FORMATS ===';
  
  FOR validation_result IN 
    SELECT * FROM validate_game_id_format()
  LOOP
    IF validation_result.invalid_count > 0 THEN
      RAISE NOTICE 'WARNING: % has % invalid game IDs', validation_result.table_name, validation_result.invalid_count;
    ELSE
      RAISE NOTICE '✓ % has valid game IDs', validation_result.table_name;
    END IF;
  END LOOP;
END $$;

-- Drop the validation function
DROP FUNCTION validate_game_id_format();

-- Test basic functionality
DO $$
DECLARE
  test_user_id UUID;
  test_game_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing game ID fix for user: %', test_user_id;
    
    -- Test game_players table access
    SELECT COUNT(*) INTO test_game_count FROM public.game_players WHERE user_id = test_user_id;
    RAISE NOTICE 'game_players records for user: %', test_game_count;
    
    -- Test games table access
    SELECT COUNT(*) INTO test_game_count FROM public.games WHERE host_id = test_user_id;
    RAISE NOTICE 'games records for user: %', test_game_count;
    
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '=== GAME ID PREFIX FIX COMPLETE ===';
  RAISE NOTICE 'Fixed any existing game IDs with game_ prefix:';
  RAISE NOTICE '- Updated game_players table';
  RAISE NOTICE '- Updated games table';
  RAISE NOTICE '- Updated game_answers table';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Game ID format issues should now be resolved!';
  RAISE NOTICE '🎉 PATCH requests should now work properly!';
END $$;
