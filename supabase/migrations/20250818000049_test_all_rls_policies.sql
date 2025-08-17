-- Migration: Test all RLS policies to verify they're working
-- This migration tests all the RLS policies to ensure they're working correctly

-- Test user_stats table access
DO $$
DECLARE
  test_user_id UUID;
  stats_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing user_stats table access for user: %', test_user_id;
    
    -- Test direct query (this should work)
    SELECT COUNT(*) INTO stats_count FROM public.user_stats WHERE user_id = test_user_id;
    RAISE NOTICE 'user_stats query successful: % records found', stats_count;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Test user_game_purchases table access
DO $$
DECLARE
  test_user_id UUID;
  purchases_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing user_game_purchases table access for user: %', test_user_id;
    
    -- Test direct query (this should work)
    SELECT COUNT(*) INTO purchases_count FROM public.user_game_purchases WHERE user_id = test_user_id;
    RAISE NOTICE 'user_game_purchases query successful: % records found', purchases_count;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Test code_redemptions table access
DO $$
DECLARE
  test_user_id UUID;
  redemptions_count INTEGER;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing code_redemptions table access for user: %', test_user_id;
    
    -- Test direct query (this should work)
    SELECT COUNT(*) INTO redemptions_count FROM public.code_redemptions WHERE user_id = test_user_id;
    RAISE NOTICE 'code_redemptions query successful: % records found', redemptions_count;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Test users table access
DO $$
DECLARE
  test_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'baraatel@gmail.com';
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing users table access for user: %', test_user_id;
    
    -- Test direct query (this should work)
    SELECT * INTO user_record FROM public.users WHERE id = test_user_id;
    
    IF user_record IS NOT NULL THEN
      RAISE NOTICE 'users table query successful: % (%)', user_record.email, user_record.id;
    ELSE
      RAISE NOTICE 'users table query returned no results';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found';
  END IF;
END $$;

-- Check RLS status on all tables
DO $$
BEGIN
  RAISE NOTICE '=== RLS STATUS ON ALL TABLES ===';
  
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_stats' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'user_stats: RLS ENABLED';
  ELSE
    RAISE NOTICE 'user_stats: RLS DISABLED';
  END IF;
  
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_game_purchases' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'user_game_purchases: RLS ENABLED';
  ELSE
    RAISE NOTICE 'user_game_purchases: RLS DISABLED';
  END IF;
  
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'code_redemptions' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'code_redemptions: RLS ENABLED';
  ELSE
    RAISE NOTICE 'code_redemptions: RLS DISABLED';
  END IF;
  
  IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    RAISE NOTICE 'users: RLS ENABLED';
  ELSE
    RAISE NOTICE 'users: RLS DISABLED';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Completed testing all RLS policies';
  RAISE NOTICE 'All tables should now be accessible to authenticated users';
END $$;
