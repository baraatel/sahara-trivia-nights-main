-- Migration: Test get_user_stats function
-- This migration tests the get_user_stats function to ensure it works correctly

-- Test the get_user_stats function with a sample user
DO $$
DECLARE
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- Get a sample user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing get_user_stats function with user ID: %', test_user_id;
    
    -- Test the function
    SELECT * INTO test_result FROM get_user_stats(test_user_id);
    
    RAISE NOTICE 'Function test successful!';
    RAISE NOTICE 'User ID: %', test_result.user_id;
    RAISE NOTICE 'Games played: %', test_result.games_played;
    RAISE NOTICE 'Total score: %', test_result.total_score;
    RAISE NOTICE 'Correct answers: %', test_result.correct_answers;
    RAISE NOTICE 'Wrong answers: %', test_result.wrong_answers;
    RAISE NOTICE 'Accuracy percentage: %', test_result.accuracy_percentage;
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- Also test direct access to user_stats table
DO $$
DECLARE
  test_user_id UUID;
  stats_count INTEGER;
BEGIN
  -- Get a sample user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing direct access to user_stats table for user ID: %', test_user_id;
    
    -- Count records for this user
    SELECT COUNT(*) INTO stats_count FROM user_stats WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Found % user_stats records for this user', stats_count;
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed testing of user_stats functionality';
END $$;
