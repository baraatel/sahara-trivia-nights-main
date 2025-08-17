
-- Add refund tracking to user_game_purchases table
ALTER TABLE user_game_purchases 
ADD COLUMN refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'processing', 'completed', 'rejected')),
ADD COLUMN refund_amount NUMERIC DEFAULT 0,
ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN refund_reason TEXT,
ADD COLUMN order_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN order_status TEXT DEFAULT 'completed' CHECK (order_status IN ('pending', 'completed', 'refunded', 'cancelled'));

-- Create refund history tracking table
CREATE TABLE public.refund_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES user_game_purchases(id) ON DELETE CASCADE,
  admin_id UUID,
  refund_amount NUMERIC NOT NULL,
  refund_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  notes TEXT
);

-- Enable RLS on refund_history
ALTER TABLE public.refund_history ENABLE ROW LEVEL SECURITY;

-- Create policies for refund_history
CREATE POLICY "Admin can view all refund history" 
ON public.refund_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@gmail.com'
));

CREATE POLICY "Admin can manage refund history" 
ON public.refund_history 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() AND auth.users.email = 'admin@gmail.com'
));

-- Update existing purchases to have order_ids and proper status
UPDATE user_game_purchases 
SET order_id = gen_random_uuid()::text 
WHERE order_id IS NULL;

-- Make order_id not nullable after setting values
ALTER TABLE user_game_purchases ALTER COLUMN order_id SET NOT NULL;
