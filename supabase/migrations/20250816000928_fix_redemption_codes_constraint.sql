-- Fix redemption_codes constraint to ensure it matches the application expectations
-- Drop the existing constraint if it exists
ALTER TABLE public.redemption_codes 
DROP CONSTRAINT IF EXISTS redemption_codes_code_type_check;

-- Add the correct constraint with all allowed values
ALTER TABLE public.redemption_codes 
ADD CONSTRAINT redemption_codes_code_type_check 
CHECK (code_type IN ('category', 'categories', 'credits', 'premium', 'games'));

-- Add comment to explain the code types
COMMENT ON COLUMN public.redemption_codes.code_type IS 'category: single category access, categories: multiple category access, credits: credit amount, premium: premium days, games: game access';

-- Verify the constraint is working by checking existing data
-- This will fail if there are any invalid code_type values
SELECT DISTINCT code_type FROM public.redemption_codes WHERE code_type NOT IN ('category', 'categories', 'credits', 'premium', 'games');
