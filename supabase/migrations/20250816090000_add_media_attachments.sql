-- Migration: Add media attachments to questions
-- This migration adds support for image, video, and audio attachments in questions

-- Add media attachment columns to questions table
ALTER TABLE public.questions 
ADD COLUMN image_url TEXT,
ADD COLUMN video_url TEXT,
ADD COLUMN audio_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.questions.image_url IS 'URL for question image attachment';
COMMENT ON COLUMN public.questions.video_url IS 'URL for question video attachment';
COMMENT ON COLUMN public.questions.audio_url IS 'URL for question audio attachment';

-- Create function to validate media URLs
CREATE OR REPLACE FUNCTION validate_media_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic URL validation
  IF url IS NULL THEN
    RETURN TRUE; -- NULL is allowed (optional attachments)
  END IF;
  
  -- Check if URL starts with http/https
  IF url NOT LIKE 'http%' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for common media file extensions
  IF url LIKE '%.jpg' OR url LIKE '%.jpeg' OR url LIKE '%.png' OR url LIKE '%.gif' OR url LIKE '%.webp' THEN
    RETURN TRUE; -- Image
  ELSIF url LIKE '%.mp4' OR url LIKE '%.avi' OR url LIKE '%.mov' OR url LIKE '%.wmv' OR url LIKE '%.webm' THEN
    RETURN TRUE; -- Video
  ELSIF url LIKE '%.mp3' OR url LIKE '%.wav' OR url LIKE '%.ogg' OR url LIKE '%.m4a' THEN
    RETURN TRUE; -- Audio
  ELSE
    RETURN FALSE; -- Unknown format
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add check constraints for media URLs
ALTER TABLE public.questions 
ADD CONSTRAINT check_image_url CHECK (validate_media_url(image_url)),
ADD CONSTRAINT check_video_url CHECK (validate_media_url(video_url)),
ADD CONSTRAINT check_audio_url CHECK (validate_media_url(audio_url));

-- Create index for better performance when filtering by media
CREATE INDEX idx_questions_media ON public.questions (image_url, video_url, audio_url) 
WHERE image_url IS NOT NULL OR video_url IS NOT NULL OR audio_url IS NOT NULL;

-- Add comment
COMMENT ON TABLE public.questions IS 'تم إضافة دعم المرفقات (الصور والفيديو والصوت) للأسئلة';
