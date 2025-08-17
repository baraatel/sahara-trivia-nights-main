-- Migration: Add media fields to questions table
-- This migration adds image_url, video_url, and audio_url columns to the questions table

-- Add media URL columns to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.questions.image_url IS 'رابط الصورة المرافقة للسؤال';
COMMENT ON COLUMN public.questions.video_url IS 'رابط الفيديو المرافق للسؤال';
COMMENT ON COLUMN public.questions.audio_url IS 'رابط الصوت المرافق للسؤال';

-- Create indexes for better performance when querying by media
CREATE INDEX IF NOT EXISTS idx_questions_has_image ON public.questions(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_has_video ON public.questions(video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_has_audio ON public.questions(audio_url) WHERE audio_url IS NOT NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added media fields to questions table.';
  RAISE NOTICE 'Added columns: image_url, video_url, audio_url';
END $$;
