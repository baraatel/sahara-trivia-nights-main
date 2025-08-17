-- Migration: Add team_assignment to game_purchase_categories table
-- This migration adds team_assignment column to track which team each category belongs to

-- Add team_assignment column to game_purchase_categories table
ALTER TABLE public.game_purchase_categories 
ADD COLUMN IF NOT EXISTS team_assignment TEXT CHECK (team_assignment IN ('team1', 'team2', NULL));

-- Add comment for the new column
COMMENT ON COLUMN public.game_purchase_categories.team_assignment IS 'الفريق المخصص للفئة (team1 أو team2 أو NULL للفئات المشتركة)';

-- Create index for better performance when querying by team assignment
CREATE INDEX IF NOT EXISTS idx_game_purchase_categories_team_assignment ON public.game_purchase_categories(team_assignment);

-- Create a function to validate team assignments
CREATE OR REPLACE FUNCTION validate_team_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we have exactly 3 categories for each team when team_assignment is set
  IF NEW.team_assignment IS NOT NULL THEN
    -- Count categories for the same team in the same game purchase
    IF (
      SELECT COUNT(*) 
      FROM public.game_purchase_categories 
      WHERE game_purchase_id = NEW.game_purchase_id 
        AND team_assignment = NEW.team_assignment
    ) > 3 THEN
      RAISE EXCEPTION 'Cannot assign more than 3 categories to the same team';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate team assignments
DROP TRIGGER IF EXISTS trigger_validate_team_assignments ON public.game_purchase_categories;
CREATE TRIGGER trigger_validate_team_assignments
  BEFORE INSERT OR UPDATE ON public.game_purchase_categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_team_assignments();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added team_assignment to game_purchase_categories table.';
  RAISE NOTICE 'Added column: team_assignment';
  RAISE NOTICE 'Created validation function and trigger';
END $$;
