-- Update RLS policies to allow service role access while keeping user data secure

-- Student Profiles: Allow users to view other completed profiles for matching
DROP POLICY IF EXISTS "Users can view completed profiles" ON public.student_profiles;
CREATE POLICY "Users can view completed profiles" ON public.student_profiles
FOR SELECT USING (profile_completed = true OR auth.uid()::text = user_id);

-- Student Classes: Allow users to view classes of completed profiles
DROP POLICY IF EXISTS "Users can view classes for matching" ON public.student_classes;
CREATE POLICY "Users can view classes for matching" ON public.student_classes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = student_classes.user_id
    AND student_profiles.profile_completed = true
  )
  OR auth.uid()::text = user_id
);

-- Study Preferences: Allow users to view preferences of completed profiles
DROP POLICY IF EXISTS "Users can view preferences for matching" ON public.study_preferences;
CREATE POLICY "Users can view preferences for matching" ON public.study_preferences
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles
    WHERE student_profiles.user_id = study_preferences.user_id
    AND student_profiles.profile_completed = true
  )
  OR auth.uid()::text = user_id
);

-- Matches: Allow service role to insert matches
DROP POLICY IF EXISTS "Service can insert matches" ON public.matches;
CREATE POLICY "Service can insert matches" ON public.matches
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service can update matches" ON public.matches;
CREATE POLICY "Service can update matches" ON public.matches
FOR UPDATE USING (true);
