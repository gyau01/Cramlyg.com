-- Create waitlist table for early access signups
CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON public.waitlist(created_at);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public signup)
CREATE POLICY "Allow public insert on waitlist" ON public.waitlist
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users to read (for admin purposes)
CREATE POLICY "Allow authenticated read on waitlist" ON public.waitlist
    FOR SELECT
    TO authenticated
    USING (true);

