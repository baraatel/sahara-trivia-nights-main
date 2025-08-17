-- Migration: Update related tables and functions after removing English fields
-- This migration updates any references to English fields in other parts of the database

-- Update any views that might reference English fields
-- Drop and recreate views that might have referenced English fields

-- Create a new view for questions with category information (Arabic only)
DROP VIEW IF EXISTS questions_with_categories_arabic;
CREATE VIEW questions_with_categories_arabic AS
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
  q.created_at,
  q.updated_at,
  c.name_ar as category_name,
  c.name_ar as category_name_ar
FROM public.questions q
JOIN public.categories c ON q.category_id = c.id;

-- Grant permissions on the new view
GRANT SELECT ON questions_with_categories_arabic TO authenticated;

-- Update any functions that might reference English fields
-- Create a function to get random questions for a category (Arabic only)
CREATE OR REPLACE FUNCTION get_random_questions_arabic(
  category_id_param UUID,
  question_count INTEGER DEFAULT 10
)
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
  explanation_ar TEXT
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
    q.explanation_ar
  FROM public.questions q
  WHERE q.category_id = category_id_param
  ORDER BY RANDOM()
  LIMIT question_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to search questions by Arabic text
CREATE OR REPLACE FUNCTION search_questions_arabic(search_term TEXT)
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
  similarity_score REAL
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
    GREATEST(
      similarity(q.question_ar, search_term),
      similarity(q.option_a_ar, search_term),
      similarity(q.option_b_ar, search_term),
      similarity(q.option_c_ar, search_term),
      similarity(q.option_d_ar, search_term)
    ) as similarity_score
  FROM public.questions q
  JOIN public.categories c ON q.category_id = c.id
  WHERE 
    q.question_ar ILIKE '%' || search_term || '%' OR
    q.option_a_ar ILIKE '%' || search_term || '%' OR
    q.option_b_ar ILIKE '%' || search_term || '%' OR
    q.option_c_ar ILIKE '%' || search_term || '%' OR
    q.option_d_ar ILIKE '%' || search_term || '%' OR
    (q.explanation_ar IS NOT NULL AND q.explanation_ar ILIKE '%' || search_term || '%')
  ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get questions by difficulty level (Arabic only)
CREATE OR REPLACE FUNCTION get_questions_by_difficulty_arabic(
  difficulty_level_param INTEGER,
  category_id_param UUID DEFAULT NULL
)
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
  category_name_ar TEXT
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
    c.name_ar as category_name_ar
  FROM public.questions q
  JOIN public.categories c ON q.category_id = c.id
  WHERE q.difficulty_level = difficulty_level_param
    AND (category_id_param IS NULL OR q.category_id = category_id_param)
  ORDER BY RANDOM();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION get_random_questions_arabic(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_questions_arabic(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_questions_by_difficulty_arabic(INTEGER, UUID) TO authenticated;

-- Create indexes for better performance on Arabic content
CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty 
ON public.questions(category_id, difficulty_level);

CREATE INDEX IF NOT EXISTS idx_questions_created_at 
ON public.questions(created_at DESC);

-- Create a function to get question statistics (Arabic content only)
CREATE OR REPLACE FUNCTION get_question_stats_arabic()
RETURNS TABLE (
  total_questions BIGINT,
  questions_with_explanations BIGINT,
  avg_difficulty_level NUMERIC,
  questions_per_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_questions,
    COUNT(q.explanation_ar) as questions_with_explanations,
    ROUND(AVG(q.difficulty_level), 2) as avg_difficulty_level,
    jsonb_object_agg(c.name_ar, category_count.count) as questions_per_category
  FROM public.questions q
  JOIN public.categories c ON q.category_id = c.id
  JOIN (
    SELECT 
      c2.id as category_id,
      COUNT(q2.id) as count
    FROM public.categories c2
    LEFT JOIN public.questions q2 ON c2.id = q2.category_id
    GROUP BY c2.id
  ) category_count ON c.id = category_count.category_id
  GROUP BY category_count.count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on stats function
GRANT EXECUTE ON FUNCTION get_question_stats_arabic() TO authenticated;

-- Update RLS policies to ensure they work with Arabic-only structure
-- (The existing policies should still work, but let's make sure)

-- Create a policy for searching questions
CREATE POLICY "Users can search questions" ON public.questions
FOR SELECT USING (true);

-- Create a policy for getting questions by category
CREATE POLICY "Users can get questions by category" ON public.questions
FOR SELECT USING (true);

-- Log the completion of related updates
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Updated related tables and functions for Arabic-only questions structure.';
  RAISE NOTICE 'Created new functions: get_random_questions_arabic, search_questions_arabic, get_questions_by_difficulty_arabic, get_question_stats_arabic';
  RAISE NOTICE 'Created new view: questions_with_categories_arabic';
END $$;
