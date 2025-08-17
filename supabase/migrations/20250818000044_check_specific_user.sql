-- Migration: Check specific user causing 406 error
-- This migration checks if the specific user has a user_stats record

-- Check if the specific user exists and has a user_stats record
DO $$
DECLARE
  user_exists BOOLEAN;
  stats_exists BOOLEAN;
  user_email TEXT;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = 'a996de82-6ef1-407a-b49a-841dfdab3692') INTO user_exists;
  
  IF user_exists THEN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = 'a996de82-6ef1-407a-b49a-841dfdab3692';
    RAISE NOTICE 'User exists: % (%)', user_email, 'a996de82-6ef1-407a-b49a-841dfdab3692';
    
    -- Check if user has stats record
    SELECT EXISTS(SELECT 1 FROM public.user_stats WHERE user_id = 'a996de82-6ef1-407a-b49a-841dfdab3692') INTO stats_exists;
    
    IF stats_exists THEN
      RAISE NOTICE 'User has user_stats record';
      
      -- Show the stats record
      DECLARE
        stats_record RECORD;
      BEGIN
        SELECT * INTO stats_record FROM public.user_stats WHERE user_id = 'a996de82-6ef1-407a-b49a-841dfdab3692';
        RAISE NOTICE 'Stats: games_played=%, total_score=%, questions_answered=%, correct_answers=%, wrong_answers=%', 
          stats_record.games_played, 
          stats_record.total_score, 
          stats_record.questions_answered, 
          stats_record.correct_answers, 
          stats_record.wrong_answers;
      END;
    ELSE
      RAISE NOTICE 'User does NOT have user_stats record - creating one';
      
      -- Create a user_stats record for this user
      INSERT INTO public.user_stats (user_id, games_played, total_score, questions_answered, correct_answers, wrong_answers)
      VALUES ('a996de82-6ef1-407a-b49a-841dfdab3692', 0, 0, 0, 0, 0);
      
      RAISE NOTICE 'Created user_stats record for user';
    END IF;
  ELSE
    RAISE NOTICE 'User does NOT exist: a996de82-6ef1-407a-b49a-841dfdab3692';
  END IF;
END $$;

-- Also check all users and their stats records
DO $$
DECLARE
  user_record RECORD;
  stats_count INTEGER;
BEGIN
  RAISE NOTICE '=== ALL USERS AND THEIR STATS RECORDS ===';
  FOR user_record IN 
    SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10
  LOOP
    SELECT COUNT(*) INTO stats_count FROM public.user_stats WHERE user_id = user_record.id;
    RAISE NOTICE 'User % (%) has % stats records', user_record.email, user_record.id, stats_count;
  END LOOP;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed checking specific user and all users';
END $$;
