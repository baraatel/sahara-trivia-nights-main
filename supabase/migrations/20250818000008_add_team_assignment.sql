-- Migration: Add team_assignment column to game_purchase_categories table
-- This migration adds support for team-based category assignments

-- Add team_assignment column to game_purchase_categories table
ALTER TABLE public.game_purchase_categories 
ADD COLUMN team_assignment TEXT CHECK (team_assignment IN ('team1', 'team2', NULL));

-- Add comment to explain the column
COMMENT ON COLUMN public.game_purchase_categories.team_assignment IS 'Indicates which team this category is assigned to (team1, team2, or NULL for non-team games)';

-- Update RLS policies to include team_assignment
DROP POLICY IF EXISTS "Users can add categories to their game purchases" ON public.game_purchase_categories;

CREATE POLICY "Users can add categories to their game purchases" 
ON public.game_purchase_categories 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM game_purchases 
  WHERE game_purchases.id = game_purchase_id AND game_purchases.user_id = auth.uid()
));

-- Add policy for updating team assignments
CREATE POLICY "Users can update team assignments for their game purchases" 
ON public.game_purchase_categories 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM game_purchases 
  WHERE game_purchases.id = game_purchase_id AND game_purchases.user_id = auth.uid()
));
