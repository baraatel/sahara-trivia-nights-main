
-- Create admin user in the users table to fix RLS policy issues
INSERT INTO public.users (id, email, username, full_name, created_at)
VALUES (
  'e17f450b-f36c-4b64-a2b9-a8a5a1382804',
  'admin@gmail.com',
  'admin',
  'System Administrator',
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@gmail.com',
  username = 'admin',
  full_name = 'System Administrator';

-- Add visitor tracking table for analytics
CREATE TABLE IF NOT EXISTS public.visitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT,
  page_path TEXT,
  user_agent TEXT,
  ip_address INET,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id TEXT,
  referrer TEXT
);

-- Enable RLS on visitor_analytics
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Allow admin to view all visitor analytics
CREATE POLICY "Admin can view all visitor analytics" ON public.visitor_analytics
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com'
  )
);

-- Create financial reporting view for easier queries
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
  DATE_TRUNC('month', purchased_at) as month,
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value,
  COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN refund_status = 'completed' THEN 1 END) as refunded_orders,
  SUM(CASE WHEN refund_status = 'completed' THEN refund_amount ELSE 0 END) as total_refunds
FROM user_game_purchases
WHERE purchased_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', purchased_at)
ORDER BY month DESC;

-- Create category sales summary view
CREATE OR REPLACE VIEW public.category_sales_summary AS
SELECT 
  c.id,
  c.name_en,
  c.name_ar,
  COUNT(ugp.id) as purchase_count,
  SUM(ugp.amount) as total_revenue,
  AVG(ugp.amount) as avg_price
FROM categories c
LEFT JOIN user_game_purchases ugp ON c.id = ugp.category_id 
  AND ugp.order_status = 'completed'
GROUP BY c.id, c.name_en, c.name_ar
ORDER BY total_revenue DESC NULLS LAST;
