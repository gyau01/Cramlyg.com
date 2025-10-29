CREATE TABLE IF NOT EXISTS public.student_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
    university text NOT NULL,
    major text NOT NULL,
    year_of_study text NOT NULL,
    gpa numeric(3,2),
    bio text,
    profile_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_classes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    class_code text NOT NULL,
    class_name text NOT NULL,
    semester text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.study_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
    study_time_preference text[],
    study_location_preference text[],
    group_size_preference text,
    study_style text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.match_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    receiver_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    user2_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    compatibility_score numeric(5,2),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS student_profiles_user_id_idx ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS student_classes_user_id_idx ON public.student_classes(user_id);
CREATE INDEX IF NOT EXISTS study_preferences_user_id_idx ON public.study_preferences(user_id);
CREATE INDEX IF NOT EXISTS match_requests_sender_id_idx ON public.match_requests(sender_id);
CREATE INDEX IF NOT EXISTS match_requests_receiver_id_idx ON public.match_requests(receiver_id);
CREATE INDEX IF NOT EXISTS matches_user1_id_idx ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS matches_user2_id_idx ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS messages_match_id_idx ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.student_profiles;
CREATE POLICY "Users can view own profile" ON public.student_profiles
FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.student_profiles;
CREATE POLICY "Users can insert own profile" ON public.student_profiles
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.student_profiles;
CREATE POLICY "Users can update own profile" ON public.student_profiles
FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own classes" ON public.student_classes;
CREATE POLICY "Users can view own classes" ON public.student_classes
FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own classes" ON public.student_classes;
CREATE POLICY "Users can insert own classes" ON public.student_classes
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own classes" ON public.student_classes;
CREATE POLICY "Users can delete own classes" ON public.student_classes
FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own preferences" ON public.study_preferences;
CREATE POLICY "Users can view own preferences" ON public.study_preferences
FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.study_preferences;
CREATE POLICY "Users can insert own preferences" ON public.study_preferences
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.study_preferences;
CREATE POLICY "Users can update own preferences" ON public.study_preferences
FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view sent requests" ON public.match_requests;
CREATE POLICY "Users can view sent requests" ON public.match_requests
FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);

DROP POLICY IF EXISTS "Users can insert requests" ON public.match_requests;
CREATE POLICY "Users can insert requests" ON public.match_requests
FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

DROP POLICY IF EXISTS "Users can update received requests" ON public.match_requests;
CREATE POLICY "Users can update received requests" ON public.match_requests
FOR UPDATE USING (auth.uid()::text = receiver_id);

DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
CREATE POLICY "Users can view own matches" ON public.matches
FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

DROP POLICY IF EXISTS "Users can view match messages" ON public.messages;
CREATE POLICY "Users can view match messages" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid()::text OR matches.user2_id = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid()::text OR matches.user2_id = auth.uid()::text)
    )
);

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table match_requests;
alter publication supabase_realtime add table matches;