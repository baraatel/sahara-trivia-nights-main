-- Migration: Remove English fields from questions table
-- This migration removes all English language fields from the questions table
-- to simplify the schema and focus on Arabic content only

-- Drop English columns from questions table
ALTER TABLE public.questions DROP COLUMN IF EXISTS question_en;
ALTER TABLE public.questions DROP COLUMN IF EXISTS option_a_en;
ALTER TABLE public.questions DROP COLUMN IF EXISTS option_b_en;
ALTER TABLE public.questions DROP COLUMN IF EXISTS option_c_en;
ALTER TABLE public.questions DROP COLUMN IF EXISTS option_d_en;
ALTER TABLE public.questions DROP COLUMN IF EXISTS explanation_en;

-- Update the questions table structure to make Arabic fields required
-- (They were already required, but this ensures consistency)
ALTER TABLE public.questions 
  ALTER COLUMN question_ar SET NOT NULL,
  ALTER COLUMN option_a_ar SET NOT NULL,
  ALTER COLUMN option_b_ar SET NOT NULL,
  ALTER COLUMN option_c_ar SET NOT NULL,
  ALTER COLUMN option_d_ar SET NOT NULL;

-- Add comments to document the Arabic-only structure
COMMENT ON COLUMN public.questions.question_ar IS 'السؤال باللغة العربية';
COMMENT ON COLUMN public.questions.option_a_ar IS 'الخيار أ باللغة العربية';
COMMENT ON COLUMN public.questions.option_b_ar IS 'الخيار ب باللغة العربية';
COMMENT ON COLUMN public.questions.option_c_ar IS 'الخيار ج باللغة العربية';
COMMENT ON COLUMN public.questions.option_d_ar IS 'الخيار د باللغة العربية';
COMMENT ON COLUMN public.questions.explanation_ar IS 'شرح الإجابة باللغة العربية (اختياري)';

-- Update any existing views or functions that might reference English fields
-- (This is a precaution in case there are any database views or functions)

-- Create a function to validate question data (Arabic content validation)
CREATE OR REPLACE FUNCTION validate_question_arabic_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if Arabic question is not empty
  IF NEW.question_ar IS NULL OR TRIM(NEW.question_ar) = '' THEN
    RAISE EXCEPTION 'السؤال باللغة العربية مطلوب';
  END IF;
  
  -- Check if all Arabic options are not empty
  IF NEW.option_a_ar IS NULL OR TRIM(NEW.option_a_ar) = '' THEN
    RAISE EXCEPTION 'الخيار أ باللغة العربية مطلوب';
  END IF;
  
  IF NEW.option_b_ar IS NULL OR TRIM(NEW.option_b_ar) = '' THEN
    RAISE EXCEPTION 'الخيار ب باللغة العربية مطلوب';
  END IF;
  
  IF NEW.option_c_ar IS NULL OR TRIM(NEW.option_c_ar) = '' THEN
    RAISE EXCEPTION 'الخيار ج باللغة العربية مطلوب';
  END IF;
  
  IF NEW.option_d_ar IS NULL OR TRIM(NEW.option_d_ar) = '' THEN
    RAISE EXCEPTION 'الخيار د باللغة العربية مطلوب';
  END IF;
  
  -- Check if correct answer is valid
  IF NEW.correct_answer NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'الإجابة الصحيحة يجب أن تكون A, B, C, أو D';
  END IF;
  
  -- Check if difficulty level is valid
  IF NEW.difficulty_level < 1 OR NEW.difficulty_level > 5 THEN
    RAISE EXCEPTION 'مستوى الصعوبة يجب أن يكون بين 1 و 5';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate Arabic content before insert/update
DROP TRIGGER IF EXISTS validate_question_arabic_trigger ON public.questions;
CREATE TRIGGER validate_question_arabic_trigger
  BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION validate_question_arabic_content();

-- Update the table comment to reflect Arabic-only structure
COMMENT ON TABLE public.questions IS 'جدول الأسئلة - يحتوي على الأسئلة والخيارات باللغة العربية فقط';

-- Create an index for better performance on Arabic text search
CREATE INDEX IF NOT EXISTS idx_questions_arabic_search 
ON public.questions USING gin(to_tsvector('arabic', question_ar));

-- Add a function to get questions with Arabic content only
CREATE OR REPLACE FUNCTION get_questions_arabic(category_id_param UUID DEFAULT NULL)
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
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
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
    q.created_at,
    q.updated_at,
    c.name_ar as category_name_ar
  FROM public.questions q
  JOIN public.categories c ON q.category_id = c.id
  WHERE (category_id_param IS NULL OR q.category_id = category_id_param)
  ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_questions_arabic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_question_arabic_content() TO authenticated;

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Removed English fields from questions table. Table now contains Arabic content only.';
END $$;
