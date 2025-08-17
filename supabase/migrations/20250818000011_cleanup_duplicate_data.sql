-- Migration: Cleanup duplicate data and fix constraints
-- This migration removes existing duplicate data and ensures proper constraints

-- First, let's identify and remove duplicate entries
-- Keep only the first occurrence of each game_purchase_id + category_id combination
DELETE FROM public.game_purchase_categories 
WHERE id NOT IN (
  SELECT DISTINCT ON (game_purchase_id, category_id) id
  FROM public.game_purchase_categories
  ORDER BY game_purchase_id, category_id, created_at
);

-- Drop any existing constraints that might be causing issues
ALTER TABLE public.game_purchase_categories 
DROP CONSTRAINT IF EXISTS game_purchase_categories_game_purchase_id_category_id_key;

ALTER TABLE public.game_purchase_categories 
DROP CONSTRAINT IF EXISTS game_purchase_categories_unique;

-- Add a proper unique constraint
ALTER TABLE public.game_purchase_categories 
ADD CONSTRAINT game_purchase_categories_unique 
UNIQUE (game_purchase_id, category_id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_game_purchase_categories_purchase_id 
ON public.game_purchase_categories(game_purchase_id);

CREATE INDEX IF NOT EXISTS idx_game_purchase_categories_category_id 
ON public.game_purchase_categories(category_id);

-- Create a function to safely insert categories with proper error handling
CREATE OR REPLACE FUNCTION insert_game_purchase_categories_safe_v2(
  purchase_id UUID,
  category_ids UUID[],
  team_assignments TEXT[]
)
RETURNS JSON AS $$
DECLARE
  i INTEGER;
  category_id UUID;
  team_assignment TEXT;
  result JSON;
  inserted_count INTEGER := 0;
BEGIN
  -- First, delete any existing categories for this purchase
  DELETE FROM public.game_purchase_categories 
  WHERE game_purchase_id = purchase_id;
  
  -- Then insert the new categories
  FOR i IN 1..array_length(category_ids, 1) LOOP
    category_id := category_ids[i];
    team_assignment := team_assignments[i];
    
    BEGIN
      INSERT INTO public.game_purchase_categories (
        game_purchase_id, 
        category_id, 
        team_assignment
      ) VALUES (
        purchase_id, 
        category_id, 
        team_assignment
      );
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN unique_violation THEN
      -- Skip duplicates silently
      CONTINUE;
    END;
  END LOOP;
  
  result := json_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'total_categories', array_length(category_ids, 1)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION insert_game_purchase_categories_safe_v2(UUID, UUID[], TEXT[]) TO authenticated;

-- Add comment
COMMENT ON FUNCTION insert_game_purchase_categories_safe_v2(UUID, UUID[], TEXT[]) IS 'إدراج فئات شراء اللعبة بأمان مع معالجة الأخطاء';

-- Log completion
COMMENT ON TABLE public.game_purchase_categories IS 'تم تنظيف البيانات المكررة وإصلاح القيود';
