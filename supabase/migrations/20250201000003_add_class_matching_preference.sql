-- Add class_matching_preference field to study_preferences table
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS class_matching_preference text DEFAULT 'specific';

-- Add comment to explain the field
COMMENT ON COLUMN public.study_preferences.class_matching_preference IS 'Matching preference: "generic" matches by major/subject area, "specific" matches by exact class codes';

