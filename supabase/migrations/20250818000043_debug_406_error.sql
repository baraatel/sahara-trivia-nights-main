-- Migration: Debug 406 error with user_stats table
-- This migration helps debug why users are getting 406 errors

-- Check the current structure of user_stats table
DO $$
DECLARE
  column_record RECORD;
BEGIN
  RAISE NOTICE '=== USER_STATS TABLE STRUCTURE ===';
  FOR column_record IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stats'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
      column_record.column_name, 
      column_record.data_type, 
      column_record.is_nullable, 
      column_record.column_default;
  END LOOP;
END $$;

-- Check if RLS is still disabled
DO $$
BEGIN
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_stats' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'RLS is STILL ENABLED on user_stats table';
  ELSE
    RAISE NOTICE 'RLS is DISABLED on user_stats table (as expected)';
  END IF;
END $$;

-- Check if there are any constraints that might be causing issues
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  RAISE NOTICE '=== CONSTRAINTS ON USER_STATS TABLE ===';
  FOR constraint_record IN 
    SELECT conname, contype, pg_get_constraintdef(oid) as definition
    FROM pg_constraint 
    WHERE conrelid = 'public.user_stats'::regclass
  LOOP
    RAISE NOTICE 'Constraint: %, Type: %, Definition: %', 
      constraint_record.conname, 
      constraint_record.contype, 
      constraint_record.definition;
  END LOOP;
END $$;

-- Test direct query to user_stats table
DO $$
DECLARE
  test_user_id UUID;
  stats_record RECORD;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing direct query for user ID: %', test_user_id;
    
    -- Try to select from user_stats
    SELECT * INTO stats_record FROM public.user_stats WHERE user_id = test_user_id;
    
    IF stats_record IS NOT NULL THEN
      RAISE NOTICE 'Direct query successful!';
      RAISE NOTICE 'User ID: %, Games played: %, Total score: %', 
        stats_record.user_id, 
        stats_record.games_played, 
        stats_record.total_score;
    ELSE
      RAISE NOTICE 'No record found for this user';
    END IF;
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- Check if there are any triggers that might be causing issues
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '=== TRIGGERS ON USER_STATS TABLE ===';
  FOR trigger_record IN 
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers 
    WHERE event_object_table = 'user_stats' 
    AND trigger_schema = 'public'
  LOOP
    RAISE NOTICE 'Trigger: %, Event: %, Action: %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation, 
      trigger_record.action_statement;
  END LOOP;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed debugging of 406 error for user_stats table';
END $$;
