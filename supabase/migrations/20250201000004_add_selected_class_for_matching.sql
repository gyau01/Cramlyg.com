-- Add selected_class_code field to study_preferences table for specific class matching
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS selected_class_code text;

-- Add comment to explain the field
COMMENT ON COLUMN public.study_preferences.selected_class_code IS 'The specific class code to match on when class_matching_preference is "specific"';

