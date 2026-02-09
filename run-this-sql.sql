-- Step 1: Create the class_list table
CREATE TABLE IF NOT EXISTS public.class_list (
    class_code text NOT NULL,
    class_name text NOT NULL,
    university_id integer NOT NULL,
    class_id SERIAL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (class_code, class_name, university_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS class_list_university_id_idx ON public.class_list(university_id);
CREATE INDEX IF NOT EXISTS class_list_class_code_idx ON public.class_list(class_code);

-- Step 3: Insert University of Louisville classes (University_ID = 1000)
INSERT INTO public.class_list (class_code, class_name, university_id) VALUES
('MATH 180', 'Elements of Calculus', 1000),
('MATH 205', 'Calculus I', 1000),
('ECON 201', 'Principles of Microeconomics', 1000),
('ECON 202', 'Principles of Macroeconomics', 1000),
('CAMP 100', 'Campus Culture/Business Students', 1000),
('PHIL 222', 'Contemporary Moral Problems', 1000),
('PHIL 225', 'Business Ethics', 1000),
('PHIL 321', 'Ethics', 1000),
('PHIL 323', 'Medical Ethics', 1000),
('BUS 301', 'Business Communication', 1000),
('BUS 201', 'Career Development', 1000),
('ACCT 201', 'Principles of Financial Accounting', 1000),
('ACCT 202', 'Principles of Managerial Accounting', 1000),
('BSTA 201', 'Business Statistics', 1000),
('CIS 205', 'Introduction to Information Systems', 1000),
('FIN 301', 'Corporate Finance', 1000),
('MGMT 301', 'Management and Organizational Behavior', 1000),
('MKTG 301', 'Marketing', 1000),
('CLAW 301', 'Legal Environment of Business', 1000),
('ACCT 310', 'Introduction to Accounting Information Systems', 1000),
('ACCT 320', 'Managerial Cost Accounting', 1000),
('ACCT 330', 'Intermediate Accounting I', 1000),
('ACCT 331', 'Intermediate Accounting II', 1000),
('ACCT 340', 'Taxation of Business Entities', 1000),
('ACCT 430', 'Auditing Theory and Practice', 1000),
('ACCT 411', 'Capstone Seminar in Accounting', 1000),
('ACCT 353', 'Accounting for Not-For-Profit Organizations', 1000),
('ACCT 401', 'Advanced Accounting Problems', 1000),
('ACCT 415', 'Taxation of Individuals', 1000),
('ACCT 420', 'Advanced Managerial Cost Accounting', 1000),
('MGMT 401', 'Operations Management', 1000),
('MGMT 404', 'Project Management', 1000)
ON CONFLICT (class_code, class_name, university_id) DO NOTHING;

