
-- Create categories table for trivia question categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  option_a_ar TEXT NOT NULL,
  option_a_en TEXT NOT NULL,
  option_b_ar TEXT NOT NULL,
  option_b_en TEXT NOT NULL,
  option_c_ar TEXT NOT NULL,
  option_c_en TEXT NOT NULL,
  option_d_ar TEXT NOT NULL,
  option_d_en TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  explanation_ar TEXT,
  explanation_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table for multiplayer sessions
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  room_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  max_players INTEGER DEFAULT 10,
  current_question INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create game_players table for tracking players in games
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create game_answers table for tracking player answers
CREATE TABLE public.game_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_taken INTEGER, -- in seconds
  UNIQUE(game_id, user_id, question_id)
);

-- Create user_purchases table for tracking category purchases
CREATE TABLE public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email = 'admin@gmail.com')
);

-- Create RLS policies for questions
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admin can manage questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email = 'admin@gmail.com')
);

-- Create RLS policies for games
CREATE POLICY "Users can view games they participate in" ON public.games FOR SELECT USING (
  host_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.game_players WHERE game_id = id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create games" ON public.games FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Game hosts can update their games" ON public.games FOR UPDATE USING (host_id = auth.uid());

-- Create RLS policies for game_players
CREATE POLICY "Users can view game players for games they participate in" ON public.game_players FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.games WHERE id = game_id AND host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.game_players gp WHERE gp.game_id = game_id AND gp.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can join games" ON public.game_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own game player status" ON public.game_players FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for game_answers
CREATE POLICY "Users can view answers for games they participate in" ON public.game_answers FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.games WHERE id = game_id AND host_id = auth.uid())
);
CREATE POLICY "Users can submit their own answers" ON public.game_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_purchases
CREATE POLICY "Users can view their own purchases" ON public.user_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can make purchases" ON public.user_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can view all purchases" ON public.user_purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email = 'admin@gmail.com')
);

-- Insert sample categories
INSERT INTO public.categories (name_ar, name_en, description_ar, description_en, is_free) VALUES
('التاريخ الإسلامي', 'Islamic History', 'أسئلة حول التاريخ الإسلامي والحضارة', 'Questions about Islamic history and civilization', true),
('العلوم العامة', 'General Science', 'أسئلة في العلوم المختلفة', 'Questions in various sciences', true),
('الجغرافيا', 'Geography', 'أسئلة حول البلدان والقارات', 'Questions about countries and continents', false),
('الرياضة', 'Sports', 'أسئلة رياضية متنوعة', 'Various sports questions', false),
('الأدب العربي', 'Arabic Literature', 'أسئلة في الشعر والنثر العربي', 'Questions about Arabic poetry and prose', false);

-- Insert sample questions for Islamic History category
INSERT INTO public.questions (category_id, question_ar, question_en, option_a_ar, option_a_en, option_b_ar, option_b_en, option_c_ar, option_c_en, option_d_ar, option_d_en, correct_answer) 
SELECT 
  c.id,
  'من هو أول خليفة راشد؟',
  'Who was the first Rashidun Caliph?',
  'أبو بكر الصديق',
  'Abu Bakr al-Siddiq',
  'عمر بن الخطاب',
  'Umar ibn al-Khattab',
  'عثمان بن عفان',
  'Uthman ibn Affan',
  'علي بن أبي طالب',
  'Ali ibn Abi Talib',
  'A'
FROM public.categories c WHERE c.name_en = 'Islamic History';

INSERT INTO public.questions (category_id, question_ar, question_en, option_a_ar, option_a_en, option_b_ar, option_b_en, option_c_ar, option_c_en, option_d_ar, option_d_en, correct_answer)
SELECT 
  c.id,
  'في أي عام حدثت غزوة بدر؟',
  'In which year did the Battle of Badr occur?',
  '1 هـ',
  '1 AH',
  '2 هـ',
  '2 AH',
  '3 هـ',
  '3 AH',
  '4 هـ',
  '4 AH',
  'B'
FROM public.categories c WHERE c.name_en = 'Islamic History';

-- Generate room code function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;
