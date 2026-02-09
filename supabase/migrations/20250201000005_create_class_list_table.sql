-- Create class_list table to store university course catalogs
CREATE TABLE IF NOT EXISTS public.class_list (
    class_code text NOT NULL,
    class_name text NOT NULL,
    university_id integer NOT NULL,
    class_id SERIAL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (class_code, class_name, university_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS class_list_university_id_idx ON public.class_list(university_id);
CREATE INDEX IF NOT EXISTS class_list_class_code_idx ON public.class_list(class_code);

-- Add comment
COMMENT ON TABLE public.class_list IS 'University course catalog listing with class codes and names';
COMMENT ON COLUMN public.class_list.class_id IS 'Unique identifier for each class';
COMMENT ON COLUMN public.class_list.class_code IS 'Course code (e.g., ACCT 201)';
COMMENT ON COLUMN public.class_list.class_name IS 'Full course name';
COMMENT ON COLUMN public.class_list.university_id IS 'University identifier (1000 for University of Louisville)';

