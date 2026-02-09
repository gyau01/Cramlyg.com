-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    poll_type text NOT NULL DEFAULT 'general',
    options text[] NOT NULL,
    votes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create poll_votes table to track individual votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    selected_option text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS polls_user_id_idx ON public.polls(user_id);
CREATE INDEX IF NOT EXISTS polls_poll_type_idx ON public.polls(poll_type);
CREATE INDEX IF NOT EXISTS polls_created_at_idx ON public.polls(created_at);
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS poll_votes_user_id_idx ON public.poll_votes(user_id);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
DROP POLICY IF EXISTS "Users can view all polls" ON public.polls;
CREATE POLICY "Users can view all polls" ON public.polls
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create polls" ON public.polls;
CREATE POLICY "Users can create polls" ON public.polls
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own polls" ON public.polls;
CREATE POLICY "Users can update own polls" ON public.polls
FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own polls" ON public.polls;
CREATE POLICY "Users can delete own polls" ON public.polls
FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for poll_votes
DROP POLICY IF EXISTS "Users can view all poll votes" ON public.poll_votes;
CREATE POLICY "Users can view all poll votes" ON public.poll_votes
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create poll votes" ON public.poll_votes;
CREATE POLICY "Users can create poll votes" ON public.poll_votes
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own poll votes" ON public.poll_votes;
CREATE POLICY "Users can view own poll votes" ON public.poll_votes
FOR SELECT USING (auth.uid()::text = user_id);

