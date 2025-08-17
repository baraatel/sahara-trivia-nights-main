-- Migration: Add test redemption code
-- This migration adds a test redemption code for testing purposes

-- Insert a test redemption code
INSERT INTO public.redemption_codes (
  code,
  code_type,
  value_type,
  value_data,
  is_active,
  usage_limit,
  usage_count,
  created_at,
  expires_at
) VALUES (
  'TEST123',
  'category',
  'access',
  '{"category_id": "1"}',
  true,
  100,
  0,
  NOW(),
  NOW() + INTERVAL '1 year'
) ON CONFLICT (code) DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Added test redemption code: TEST123';
  RAISE NOTICE 'This code can be used to test the redemption functionality';
  RAISE NOTICE 'Code type: category access';
  RAISE NOTICE 'Usage limit: 100';
  RAISE NOTICE 'Expires: 1 year from now';
END $$;
