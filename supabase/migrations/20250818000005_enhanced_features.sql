-- Create game_purchases table to track individual game purchases
CREATE TABLE public.game_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price NUMERIC NOT NULL DEFAULT 9.99,
  status TEXT NOT NULL DEFAULT 'active',
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_purchase_categories table to link game purchases to 6 selected categories
CREATE TABLE public.game_purchase_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_purchase_id UUID NOT NULL,
  category_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_purchase_id, category_id)
);

-- Create game_purchase_questions table to track which questions were shown
CREATE TABLE public.game_purchase_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_purchase_id UUID NOT NULL,
  question_id UUID NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_purchase_id, question_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.game_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_purchase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_purchase_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_purchases
CREATE POLICY "Users can view their own game purchases" 
ON public.game_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game purchases" 
ON public.game_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game purchases" 
ON public.game_purchases 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all game purchases" 
ON public.game_purchases 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.email = 'admin@gmail.com'
));

-- RLS policies for game_purchase_categories
CREATE POLICY "Users can view categories for their game purchases" 
ON public.game_purchase_categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM game_purchases 
  WHERE game_purchases.id = game_purchase_id AND game_purchases.user_id = auth.uid()
));

CREATE POLICY "Users can add categories to their game purchases" 
ON public.game_purchase_categories 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM game_purchases 
  WHERE game_purchases.id = game_purchase_id AND game_purchases.user_id = auth.uid()
));

-- RLS policies for game_purchase_questions
CREATE POLICY "Users can view questions for their game purchases" 
ON public.game_purchase_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM game_purchases 
  WHERE game_purchases.id = game_purchase_id AND game_purchases.user_id = auth.uid()
));

CREATE POLICY "System can track questions for game purchases" 
ON public.game_purchase_questions 
FOR INSERT 
WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.game_purchase_categories 
ADD CONSTRAINT fk_game_purchase_categories_game_purchase 
FOREIGN KEY (game_purchase_id) REFERENCES public.game_purchases(id) ON DELETE CASCADE;

ALTER TABLE public.game_purchase_categories 
ADD CONSTRAINT fk_game_purchase_categories_category 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE public.game_purchase_questions 
ADD CONSTRAINT fk_game_purchase_questions_game_purchase 
FOREIGN KEY (game_purchase_id) REFERENCES public.game_purchases(id) ON DELETE CASCADE;

ALTER TABLE public.game_purchase_questions 
ADD CONSTRAINT fk_game_purchase_questions_question 
FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

-- Enhance redemption codes to support multiple categories and game access
-- Update the code_type check constraint to include new types
ALTER TABLE public.redemption_codes 
DROP CONSTRAINT IF EXISTS redemption_codes_code_type_check;

ALTER TABLE public.redemption_codes 
ADD CONSTRAINT redemption_codes_code_type_check 
CHECK (code_type IN ('category', 'categories', 'credits', 'premium', 'games'));

-- Add comment to explain the new code types
COMMENT ON COLUMN public.redemption_codes.code_type IS 'category: single category access, categories: multiple category access, credits: credit amount, premium: premium days, games: game access';

-- Create a new table to track user category access from redemption codes
CREATE TABLE IF NOT EXISTS public.user_category_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('purchase', 'redemption_code', 'admin_grant')),
  source_id UUID, -- redemption_code_id or purchase_id
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, category_id, source_type, source_id)
);

-- Enable RLS on user_category_access
ALTER TABLE public.user_category_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_category_access
CREATE POLICY "Users can view their own category access" ON public.user_category_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category access" ON public.user_category_access
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all category access" ON public.user_category_access
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Create a new table to track user game access from redemption codes
CREATE TABLE IF NOT EXISTS public.user_game_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('purchase', 'redemption_code', 'admin_grant')),
  source_id UUID, -- redemption_code_id or purchase_id
  games_granted INTEGER NOT NULL DEFAULT 1,
  games_used INTEGER DEFAULT 0,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create user credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user premium table
CREATE TABLE IF NOT EXISTS public.user_premium (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  premium_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_game_access
ALTER TABLE public.user_game_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_game_access
CREATE POLICY "Users can view their own game access" ON public.user_game_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game access" ON public.user_game_access
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game access" ON public.user_game_access
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all game access" ON public.user_game_access
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Enable RLS on user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON public.user_credits
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all credits" ON public.user_credits
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Enable RLS on user_premium
ALTER TABLE public.user_premium ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_premium
CREATE POLICY "Users can view their own premium status" ON public.user_premium
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own premium status" ON public.user_premium
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all premium status" ON public.user_premium
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'admin@gmail.com'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_category_access_user_id ON public.user_category_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_access_category_id ON public.user_category_access(category_id);
CREATE INDEX IF NOT EXISTS idx_user_game_access_user_id ON public.user_game_access(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_code_type ON public.redemption_codes(code_type);

-- Function to add credits to user account
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id_param UUID, credits_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user credits
  INSERT INTO user_credits (user_id, credits, created_at)
  VALUES (user_id_param, credits_to_add, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = user_credits.credits + credits_to_add,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add premium days to user account
CREATE OR REPLACE FUNCTION public.add_premium_days(user_id_param UUID, days_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user premium status
  INSERT INTO user_premium (user_id, premium_until, created_at)
  VALUES (
    user_id_param, 
    CASE 
      WHEN EXISTS (SELECT 1 FROM user_premium WHERE user_id = user_id_param AND premium_until > now())
      THEN (SELECT premium_until + INTERVAL '1 day' * days_to_add FROM user_premium WHERE user_id = user_id_param)
      ELSE now() + INTERVAL '1 day' * days_to_add
    END,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    premium_until = CASE 
      WHEN user_premium.premium_until > now()
      THEN user_premium.premium_until + INTERVAL '1 day' * days_to_add
      ELSE now() + INTERVAL '1 day' * days_to_add
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;