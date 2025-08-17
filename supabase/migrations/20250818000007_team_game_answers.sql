-- Migration: Add team game answers table
-- This migration creates a table to store answers for team games

-- Create team_game_answers table
CREATE TABLE IF NOT EXISTS public.team_game_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_game_id UUID NOT NULL REFERENCES public.team_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer CHAR(1) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  team TEXT CHECK (team IN ('team1', 'team2')),
  lifeline_used TEXT CHECK (lifeline_used IN ('hint', 'skip', 'eliminate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_game_id, user_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_game_answers_team_game_id ON public.team_game_answers(team_game_id);
CREATE INDEX IF NOT EXISTS idx_team_game_answers_user_id ON public.team_game_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_team_game_answers_question_id ON public.team_game_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_team_game_answers_created_at ON public.team_game_answers(created_at);
CREATE INDEX IF NOT EXISTS idx_team_game_answers_team ON public.team_game_answers(team);

-- Enable RLS
ALTER TABLE public.team_game_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own team game answers" ON public.team_game_answers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own team game answers" ON public.team_game_answers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team members can view answers for their team games" ON public.team_game_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_game_players
      WHERE team_game_id = team_game_answers.team_game_id AND user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON public.team_game_answers TO authenticated;

-- Create function to get team game statistics
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

-- Create function to get player statistics for team game
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

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_team_game_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_game_player_stats(UUID, UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE public.team_game_answers IS 'جدول إجابات ألعاب الفرق - يحتوي على إجابات اللاعبين في ألعاب الفرق';
COMMENT ON COLUMN public.team_game_answers.team_game_id IS 'معرف لعبة الفريق';
COMMENT ON COLUMN public.team_game_answers.user_id IS 'معرف المستخدم';
COMMENT ON COLUMN public.team_game_answers.question_id IS 'معرف السؤال';
COMMENT ON COLUMN public.team_game_answers.selected_answer IS 'الإجابة المختارة';
COMMENT ON COLUMN public.team_game_answers.is_correct IS 'هل الإجابة صحيحة';
COMMENT ON COLUMN public.team_game_answers.time_taken IS 'الوقت المستغرق للإجابة بالثواني';
COMMENT ON COLUMN public.team_game_answers.points_earned IS 'النقاط المكتسبة';
COMMENT ON COLUMN public.team_game_answers.team IS 'الفريق (team1 أو team2)';
COMMENT ON COLUMN public.team_game_answers.lifeline_used IS 'نوع المساعدة المستخدمة';
COMMENT ON COLUMN public.team_game_answers.created_at IS 'تاريخ ووقت إنشاء الإجابة';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Team game answers table created successfully.';
  RAISE NOTICE 'Created table: team_game_answers';
  RAISE NOTICE 'Created functions: get_team_game_stats, get_team_game_player_stats';
END $$;
