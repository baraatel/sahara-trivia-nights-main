-- Migration: Enhanced gameplay with points system and lifelines
-- This migration adds points system, lifelines, and enhanced gameplay features

-- Add points_earned and lifeline_used columns to game_answers table
ALTER TABLE public.game_answers 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifeline_used TEXT CHECK (lifeline_used IN ('hint', 'skip', 'eliminate'));

-- Add points_earned, team, and lifeline_used columns to team_game_answers table
ALTER TABLE public.team_game_answers 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team TEXT CHECK (team IN ('team1', 'team2')),
ADD COLUMN IF NOT EXISTS lifeline_used TEXT CHECK (lifeline_used IN ('hint', 'skip', 'eliminate'));

-- Create index for team column in team_game_answers
CREATE INDEX IF NOT EXISTS idx_team_game_answers_team ON public.team_game_answers(team);

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_team_game_stats(UUID);
DROP FUNCTION IF EXISTS get_team_game_player_stats(UUID, UUID);

-- Create updated get_team_game_stats function
CREATE OR REPLACE FUNCTION get_team_game_stats(team_game_id_param UUID)
RETURNS TABLE (
  total_questions BIGINT,
  total_answers BIGINT,
  correct_answers BIGINT,
  avg_time_taken NUMERIC,
  team_score INTEGER,
  team1_score INTEGER,
  team2_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT tga.question_id) as total_questions,
    COUNT(tga.id) as total_answers,
    COUNT(tga.id) FILTER (WHERE tga.is_correct) as correct_answers,
    ROUND(AVG(tga.time_taken), 2) as avg_time_taken,
    SUM(tga.points_earned) as team_score,
    SUM(tga.points_earned) FILTER (WHERE tga.team = 'team1') as team1_score,
    SUM(tga.points_earned) FILTER (WHERE tga.team = 'team2') as team2_score
  FROM public.team_game_answers tga
  WHERE tga.team_game_id = team_game_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create updated get_team_game_player_stats function
CREATE OR REPLACE FUNCTION get_team_game_player_stats(team_game_id_param UUID, user_id_param UUID)
RETURNS TABLE (
  questions_answered BIGINT,
  correct_answers BIGINT,
  score INTEGER,
  avg_time_taken NUMERIC,
  accuracy_percentage NUMERIC,
  team TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(tga.id) as questions_answered,
    COUNT(tga.id) FILTER (WHERE tga.is_correct) as correct_answers,
    SUM(tga.points_earned) as score,
    ROUND(AVG(tga.time_taken), 2) as avg_time_taken,
    ROUND(
      (COUNT(tga.id) FILTER (WHERE tga.is_correct)::NUMERIC / 
       NULLIF(COUNT(tga.id), 0)::NUMERIC) * 100, 2
    ) as accuracy_percentage,
    MAX(tga.team) as team
  FROM public.team_game_answers tga
  WHERE tga.team_game_id = team_game_id_param 
    AND tga.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate points based on difficulty level
CREATE OR REPLACE FUNCTION calculate_question_points(difficulty_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  CASE difficulty_level
    WHEN 1 THEN RETURN 10;  -- سهل
    WHEN 2 THEN RETURN 20;  -- متوسط
    WHEN 3 THEN RETURN 30;  -- صعب
    WHEN 4 THEN RETURN 40;  -- صعب جداً
    WHEN 5 THEN RETURN 50;  -- خبير
    ELSE RETURN 10;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get questions for a game purchase (36 questions from 6 categories)
CREATE OR REPLACE FUNCTION get_game_purchase_questions(game_purchase_id_param UUID)
RETURNS TABLE (
  id UUID,
  category_id UUID,
  question_ar TEXT,
  option_a_ar TEXT,
  option_b_ar TEXT,
  option_c_ar TEXT,
  option_d_ar TEXT,
  correct_answer CHAR(1),
  difficulty_level INTEGER,
  explanation_ar TEXT,
  category_name_ar TEXT,
  team_assignment TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.category_id,
    q.question_ar,
    q.option_a_ar,
    q.option_b_ar,
    q.option_c_ar,
    q.option_d_ar,
    q.correct_answer,
    q.difficulty_level,
    q.explanation_ar,
    c.name_ar as category_name_ar,
    gpc.team_assignment
  FROM public.questions q
  JOIN public.categories c ON q.category_id = c.id
  JOIN public.game_purchase_categories gpc ON q.category_id = gpc.category_id
  WHERE gpc.game_purchase_id = game_purchase_id_param
  ORDER BY q.category_id, q.difficulty_level;
END;
$$ LANGUAGE plpgsql;

-- Create function to get total possible points for a game purchase
CREATE OR REPLACE FUNCTION get_total_possible_points(game_purchase_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  question_record RECORD;
BEGIN
  FOR question_record IN 
    SELECT q.difficulty_level
    FROM public.questions q
    JOIN public.game_purchase_categories gpc ON q.category_id = gpc.category_id
    WHERE gpc.game_purchase_id = game_purchase_id_param
    ORDER BY q.category_id, q.difficulty_level
    LIMIT 36
  LOOP
    total_points := total_points + calculate_question_points(question_record.difficulty_level);
  END LOOP;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION calculate_question_points(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_game_purchase_questions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_possible_points(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION calculate_question_points(INTEGER) IS 'تحسب النقاط بناءً على مستوى صعوبة السؤال';
COMMENT ON FUNCTION get_game_purchase_questions(UUID) IS 'تحصل على 36 سؤال من 6 فئات لشراء لعبة معين';
COMMENT ON FUNCTION get_total_possible_points(UUID) IS 'تحسب إجمالي النقاط الممكنة لشراء لعبة معين';

-- Log completion
COMMENT ON TABLE public.game_answers IS 'تم تحديث جدول إجابات الألعاب لدعم نظام النقاط والمساعدات';
COMMENT ON TABLE public.team_game_answers IS 'تم تحديث جدول إجابات ألعاب الفرق لدعم نظام النقاط والمساعدات';
