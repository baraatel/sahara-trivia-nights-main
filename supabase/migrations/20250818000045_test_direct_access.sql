-- Migration: Test direct access to user_stats table
-- This migration tests if we can access user_stats directly and lists all users

-- List all users in the database
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== ALL USERS IN DATABASE ===';
  FOR user_record IN 
    SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC
  LOOP
    RAISE NOTICE 'User: % (%) - Created: %', user_record.email, user_record.id, user_record.created_at;
  END LOOP;
END $$;

-- Test direct access to user_stats table without any filters
DO $$
DECLARE
  stats_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stats_count FROM public.user_stats;
  RAISE NOTICE 'Total user_stats records: %', stats_count;
  
  IF stats_count > 0 THEN
    RAISE NOTICE 'user_stats table is accessible and contains data';
  ELSE
    RAISE NOTICE 'user_stats table is accessible but empty';
  END IF;
END $$;

-- Test the specific query that's failing
DO $$
DECLARE
  test_result RECORD;
BEGIN
  RAISE NOTICE 'Testing the exact query that is failing:';
  RAISE NOTICE 'SELECT * FROM user_stats WHERE user_id = ''a996de82-6ef1-407a-b49a-841dfdab3692''';
  
  BEGIN
    SELECT * INTO test_result FROM public.user_stats WHERE user_id = 'a996de82-6ef1-407a-b49a-841dfdab3692';
    
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'Query SUCCESSFUL - Found record for user a996de82-6ef1-407a-b49a-841dfdab3692';
    ELSE
      RAISE NOTICE 'Query SUCCESSFUL - No record found for user a996de82-6ef1-407a-b49a-841dfdab3692 (expected)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Query FAILED with error: %', SQLERRM;
  END;
END $$;

-- Test with a valid user ID
DO $$
DECLARE
  test_result RECORD;
BEGIN
  RAISE NOTICE 'Testing with valid user ID: e5b3c74d-e818-451a-be1e-da687a1d9205';
  
  BEGIN
    SELECT * INTO test_result FROM public.user_stats WHERE user_id = 'e5b3c74d-e818-451a-be1e-da687a1d9205';
    
    IF test_result IS NOT NULL THEN
      RAISE NOTICE 'Query SUCCESSFUL - Found record for valid user';
      RAISE NOTICE 'User ID: %, Games: %, Score: %', test_result.user_id, test_result.games_played, test_result.total_score;
    ELSE
      RAISE NOTICE 'Query SUCCESSFUL - No record found for valid user (unexpected)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Query FAILED with error: %', SQLERRM;
  END;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed testing direct access to user_stats table';
END $$;
