-- Delete all user-related data in the correct order (respecting foreign keys)

-- Delete messages first (references matches)
DELETE FROM public.messages;

-- Delete matches (references users)
DELETE FROM public.matches;

-- Delete match requests (references users)
DELETE FROM public.match_requests;

-- Delete study preferences (references users)
DELETE FROM public.study_preferences;

-- Delete student classes (references users)
DELETE FROM public.student_classes;

-- Delete student profiles (references users)
DELETE FROM public.student_profiles;

-- Delete users (references auth.users)
DELETE FROM public.users;

-- Reset sequences if needed
ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS matches_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS match_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS study_preferences_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS student_classes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS student_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
