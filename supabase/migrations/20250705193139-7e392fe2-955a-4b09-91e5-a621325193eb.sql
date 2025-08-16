
-- Add tables for refund requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.user_game_purchases(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  admin_notes TEXT,
  refund_amount NUMERIC
);

-- Add table for issue reports
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.user_game_purchases(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_response TEXT
);

-- Add table for user violations
CREATE TABLE IF NOT EXISTS public.user_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  violation_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  action_taken TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  is_resolved BOOLEAN DEFAULT false
);

-- Add table for admin actions audit
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'purchase', 'redemption', etc.
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET
);

-- Add table for user notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for refund_requests
CREATE POLICY "Users can view their own refund requests" ON public.refund_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refund requests" ON public.refund_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all refund requests" ON public.refund_requests
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

-- RLS policies for issue_reports
CREATE POLICY "Users can view their own issue reports" ON public.issue_reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own issue reports" ON public.issue_reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all issue reports" ON public.issue_reports
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

-- RLS policies for user_violations
CREATE POLICY "Admin can manage user violations" ON public.user_violations
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

-- RLS policies for admin_actions
CREATE POLICY "Admin can view admin actions" ON public.admin_actions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

CREATE POLICY "Admin can create admin actions" ON public.admin_actions
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all notifications" ON public.user_notifications
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

-- Add function to check if refund is within 24 hours
CREATE OR REPLACE FUNCTION public.is_refund_eligible(purchase_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT purchase_date > (now() - interval '24 hours');
$$;

-- Add function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, details)
  VALUES (p_admin_id, p_action_type, p_target_type, p_target_id, p_details)
  RETURNING id INTO action_id;
  
  RETURN action_id;
END;
$$;

-- Allow admin to update and delete user purchases
CREATE POLICY "Admin can update user purchases" ON public.user_game_purchases
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

CREATE POLICY "Admin can delete user purchases" ON public.user_game_purchases
FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

-- Allow admin to update and delete code redemptions
CREATE POLICY "Admin can update code redemptions" ON public.code_redemptions
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);

CREATE POLICY "Admin can delete code redemptions" ON public.code_redemptions
FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com')
);
