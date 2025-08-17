-- Fix Redemption Codes Data Types
-- This migration fixes any redemption codes with incorrect data types in value_data

DO $$
BEGIN
  RAISE NOTICE '=== FIXING REDEMPTION CODES DATA TYPES ===';
  RAISE NOTICE 'Fixing any redemption codes with incorrect data types in value_data';
END $$;

-- Fix credits redemption codes - ensure amount is integer
UPDATE public.redemption_codes 
SET value_data = jsonb_set(value_data, '{amount}', to_jsonb((value_data->>'amount')::integer))
WHERE code_type = 'credits' 
AND value_data ? 'amount' 
AND jsonb_typeof(value_data->'amount') = 'string';

-- Fix premium redemption codes - ensure days is integer
UPDATE public.redemption_codes 
SET value_data = jsonb_set(value_data, '{days}', to_jsonb((value_data->>'days')::integer))
WHERE code_type = 'premium' 
AND value_data ? 'days' 
AND jsonb_typeof(value_data->'days') = 'string';

-- Fix games redemption codes - ensure game_count is integer
UPDATE public.redemption_codes 
SET value_data = jsonb_set(value_data, '{game_count}', to_jsonb((value_data->>'game_count')::integer))
WHERE code_type = 'games' 
AND value_data ? 'game_count' 
AND jsonb_typeof(value_data->'game_count') = 'string';

-- Fix category redemption codes - ensure category_id is valid UUID
-- First, let's see what invalid category_ids we have
DO $$
DECLARE
  invalid_code RECORD;
BEGIN
  RAISE NOTICE '=== CHECKING FOR INVALID CATEGORY IDs ===';
  FOR invalid_code IN 
    SELECT id, code, value_data->>'category_id' as category_id
    FROM public.redemption_codes 
    WHERE code_type = 'category' 
    AND value_data ? 'category_id' 
    AND jsonb_typeof(value_data->'category_id') = 'string'
    AND NOT (value_data->>'category_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  LOOP
    RAISE NOTICE 'Found invalid category_id: % in code: %', invalid_code.category_id, invalid_code.code;
  END LOOP;
END $$;

-- Remove invalid category redemption codes (they can't be fixed)
DELETE FROM public.redemption_codes 
WHERE code_type = 'category' 
AND value_data ? 'category_id' 
AND jsonb_typeof(value_data->'category_id') = 'string'
AND NOT (value_data->>'category_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Now fix valid UUIDs
UPDATE public.redemption_codes 
SET value_data = jsonb_set(value_data, '{category_id}', to_jsonb((value_data->>'category_id')::uuid))
WHERE code_type = 'category' 
AND value_data ? 'category_id' 
AND jsonb_typeof(value_data->'category_id') = 'string'
AND (value_data->>'category_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Fix categories redemption codes - ensure category_ids are valid UUIDs
-- First, let's see what invalid category_ids we have
DO $$
DECLARE
  invalid_code RECORD;
BEGIN
  RAISE NOTICE '=== CHECKING FOR INVALID CATEGORIES IDs ===';
  FOR invalid_code IN 
    SELECT id, code, value_data->'category_ids' as category_ids
    FROM public.redemption_codes 
    WHERE code_type = 'categories' 
    AND value_data ? 'category_ids' 
    AND jsonb_typeof(value_data->'category_ids') = 'array'
  LOOP
    RAISE NOTICE 'Found categories code: % with category_ids: %', invalid_code.code, invalid_code.category_ids;
  END LOOP;
END $$;

-- Remove invalid categories redemption codes (they can't be fixed easily)
DELETE FROM public.redemption_codes 
WHERE code_type = 'categories' 
AND value_data ? 'category_ids' 
AND jsonb_typeof(value_data->'category_ids') = 'array'
AND EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(value_data->'category_ids') AS id
  WHERE NOT (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);

-- Create a function to validate redemption code data types
CREATE OR REPLACE FUNCTION validate_redemption_code_data_types()
RETURNS TABLE (
  code_type TEXT,
  invalid_count BIGINT,
  error_details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'credits'::TEXT,
    COUNT(*)::BIGINT,
    'amount field is not integer'::TEXT
  FROM public.redemption_codes rc
  WHERE rc.code_type = 'credits' 
  AND (rc.value_data ? 'amount' = false OR jsonb_typeof(rc.value_data->'amount') != 'number')
  
  UNION ALL
  
  SELECT 
    'premium'::TEXT,
    COUNT(*)::BIGINT,
    'days field is not integer'::TEXT
  FROM public.redemption_codes rc
  WHERE rc.code_type = 'premium' 
  AND (rc.value_data ? 'days' = false OR jsonb_typeof(rc.value_data->'days') != 'number')
  
  UNION ALL
  
  SELECT 
    'games'::TEXT,
    COUNT(*)::BIGINT,
    'game_count field is not integer'::TEXT
  FROM public.redemption_codes rc
  WHERE rc.code_type = 'games' 
  AND (rc.value_data ? 'game_count' = false OR jsonb_typeof(rc.value_data->'game_count') != 'number')
  
  UNION ALL
  
  SELECT 
    'category'::TEXT,
    COUNT(*)::BIGINT,
    'category_id field is not valid UUID'::TEXT
  FROM public.redemption_codes rc
  WHERE rc.code_type = 'category' 
  AND (rc.value_data ? 'category_id' = false OR (rc.value_data->>'category_id')::uuid IS NULL)
  
  UNION ALL
  
  SELECT 
    'categories'::TEXT,
    COUNT(*)::BIGINT,
    'category_ids field is not valid UUID array'::TEXT
  FROM public.redemption_codes rc
  WHERE rc.code_type = 'categories' 
  AND (rc.value_data ? 'category_ids' = false OR jsonb_typeof(rc.value_data->'category_ids') != 'array');
END;
$$ LANGUAGE plpgsql;

-- Test the fix
DO $$
DECLARE
  validation_result RECORD;
BEGIN
  RAISE NOTICE '=== VALIDATING REDEMPTION CODE DATA TYPES ===';
  
  FOR validation_result IN 
    SELECT * FROM validate_redemption_code_data_types()
  LOOP
    IF validation_result.invalid_count > 0 THEN
      RAISE NOTICE 'WARNING: % has % invalid codes - %', 
        validation_result.code_type, 
        validation_result.invalid_count, 
        validation_result.error_details;
    ELSE
      RAISE NOTICE '✓ % has valid data types', validation_result.code_type;
    END IF;
  END LOOP;
END $$;

-- Drop the validation function
DROP FUNCTION validate_redemption_code_data_types();

-- Test basic functionality
DO $$
DECLARE
  test_code_count INTEGER;
  test_redemption_count INTEGER;
BEGIN
  RAISE NOTICE 'Testing redemption codes fix...';
  
  -- Count redemption codes
  SELECT COUNT(*) INTO test_code_count FROM public.redemption_codes;
  RAISE NOTICE 'Total redemption codes: %', test_code_count;
  
  -- Count redemptions
  SELECT COUNT(*) INTO test_redemption_count FROM public.code_redemptions;
  RAISE NOTICE 'Total redemptions: %', test_redemption_count;
  
  -- Test a sample redemption code if exists
  IF test_code_count > 0 THEN
    RAISE NOTICE 'Sample redemption code data types:';
    RAISE NOTICE 'Credits codes: %', (SELECT COUNT(*) FROM public.redemption_codes WHERE code_type = 'credits');
    RAISE NOTICE 'Premium codes: %', (SELECT COUNT(*) FROM public.redemption_codes WHERE code_type = 'premium');
    RAISE NOTICE 'Games codes: %', (SELECT COUNT(*) FROM public.redemption_codes WHERE code_type = 'games');
    RAISE NOTICE 'Category codes: %', (SELECT COUNT(*) FROM public.redemption_codes WHERE code_type = 'category');
    RAISE NOTICE 'Categories codes: %', (SELECT COUNT(*) FROM public.redemption_codes WHERE code_type = 'categories');
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '=== REDEMPTION CODES DATA TYPES FIX COMPLETE ===';
  RAISE NOTICE 'Fixed redemption codes data types:';
  RAISE NOTICE '- Ensured credits amount is integer';
  RAISE NOTICE '- Ensured premium days is integer';
  RAISE NOTICE '- Ensured games count is integer';
  RAISE NOTICE '- Ensured category_id is valid UUID';
  RAISE NOTICE '- Ensured category_ids are valid UUID array';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Redemption codes data type issues should now be resolved!';
  RAISE NOTICE '🎉 UUID parsing errors should no longer occur!';
END $$;
