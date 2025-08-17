-- Migration: Fix duplicate categories issue
-- This migration adds better constraints and cleanup for game purchase categories

-- Drop existing unique constraint if it exists
ALTER TABLE public.game_purchase_categories 
DROP CONSTRAINT IF EXISTS game_purchase_categories_game_purchase_id_category_id_key;

-- Add a more specific unique constraint
ALTER TABLE public.game_purchase_categories 
ADD CONSTRAINT game_purchase_categories_unique 
UNIQUE (game_purchase_id, category_id);

-- Create a function to safely insert categories without duplicates
CREATE OR REPLACE FUNCTION insert_game_purchase_categories_safe(
  purchase_id UUID,
  category_ids UUID[],
  team_assignments TEXT[]
)
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  category_id UUID;
  team_assignment TEXT;
BEGIN
  -- First, delete any existing categories for this purchase
  DELETE FROM public.game_purchase_categories 
  WHERE game_purchase_id = purchase_id;
  
  -- Then insert the new categories
  FOR i IN 1..array_length(category_ids, 1) LOOP
    category_id := category_ids[i];
    team_assignment := team_assignments[i];
    
    INSERT INTO public.game_purchase_categories (
      game_purchase_id, 
      category_id, 
      team_assignment
    ) VALUES (
      purchase_id, 
      category_id, 
      team_assignment
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION insert_game_purchase_categories_safe(UUID, UUID[], TEXT[]) TO authenticated;

-- Add comment
COMMENT ON FUNCTION insert_game_purchase_categories_safe(UUID, UUID[], TEXT[]) IS 'إدراج فئات شراء اللعبة بأمان بدون تكرار';

-- Create a function to get unique categories for a purchase
CREATE OR REPLACE FUNCTION get_unique_purchase_categories(purchase_id_param UUID)
RETURNS TABLE (
  category_id UUID,
  team_assignment TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT gpc.category_id, gpc.team_assignment
  FROM public.game_purchase_categories gpc
  WHERE gpc.game_purchase_id = purchase_id_param
  ORDER BY gpc.category_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_unique_purchase_categories(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_unique_purchase_categories(UUID) IS 'الحصول على الفئات الفريدة لشراء لعبة معين';

-- Log completion
COMMENT ON TABLE public.game_purchase_categories IS 'تم إصلاح مشكلة تكرار الفئات في شراء الألعاب';
