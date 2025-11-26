-- Add class_matching_preference field to study_preferences table
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS class_matching_preference text DEFAULT 'specific';

-- Add comment to explain the field
COMMENT ON COLUMN public.study_preferences.class_matching_preference IS 'Matching preference: "generic" matches by major/subject area, "specific" matches by exact class codes';

-- Add selected_class_code field to study_preferences table for specific class matching
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS selected_class_code text;

-- Add comment to explain the field
COMMENT ON COLUMN public.study_preferences.selected_class_code IS 'The specific class code to match on when class_matching_preference is "specific"';

