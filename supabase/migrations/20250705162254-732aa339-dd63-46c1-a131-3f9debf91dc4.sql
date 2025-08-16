
-- Fix the Select component issue by ensuring all SelectItem values are not empty strings
-- Add tables for payment gateway API keys management
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admin to manage settings
CREATE POLICY "Admin can manage settings" ON public.admin_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Create table for tracking user game purchases  
CREATE TABLE IF NOT EXISTS public.user_game_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_provider TEXT NOT NULL, -- 'stripe' or 'paypal'
  transaction_id TEXT,
  status TEXT DEFAULT 'completed',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS on user_game_purchases
ALTER TABLE public.user_game_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.user_game_purchases
FOR SELECT USING (auth.uid() = user_id);

-- Admin can view all purchases
CREATE POLICY "Admin can view all purchases" ON public.user_game_purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Users can make purchases
CREATE POLICY "Users can make purchases" ON public.user_game_purchases
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user stats tracking table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  games_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats
CREATE POLICY "Users can view own stats" ON public.user_stats
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats" ON public.user_stats
FOR UPDATE USING (auth.uid() = user_id);

-- Users can create their own stats
CREATE POLICY "Users can create own stats" ON public.user_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view all stats
CREATE POLICY "Admin can view all stats" ON public.user_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);
