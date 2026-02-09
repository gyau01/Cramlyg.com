-- Insert University of Louisville classes from Accountancy BSBA program
-- University_ID = 1000 for University of Louisville
-- Class_ID will auto-increment starting from 1 (SERIAL type handles this automatically)

INSERT INTO public.class_list (class_code, class_name, university_id) VALUES
-- General Education and Core Requirements
('MATH 180', 'Elements of Calculus', 1000),
('MATH 205', 'Calculus I', 1000),
('ECON 201', 'Principles of Microeconomics', 1000),
('ECON 202', 'Principles of Macroeconomics', 1000),

-- College of Business Requirements
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

-- Accountancy Major Requirements
('ACCT 310', 'Introduction to Accounting Information Systems', 1000),
('ACCT 320', 'Managerial Cost Accounting', 1000),
('ACCT 330', 'Intermediate Accounting I', 1000),
('ACCT 331', 'Intermediate Accounting II', 1000),
('ACCT 340', 'Taxation of Business Entities', 1000),
('ACCT 430', 'Auditing Theory and Practice', 1000),
('ACCT 411', 'Capstone Seminar in Accounting', 1000),

-- Accountancy Electives
('ACCT 353', 'Accounting for Not-For-Profit Organizations', 1000),
('ACCT 401', 'Advanced Accounting Problems', 1000),
('ACCT 415', 'Taxation of Individuals', 1000),
('ACCT 420', 'Advanced Managerial Cost Accounting', 1000),

-- Additional Business Courses
('MGMT 401', 'Operations Management', 1000),
('MGMT 404', 'Project Management', 1000)

ON CONFLICT (class_code, class_name, university_id) DO NOTHING;

-- Note: Class_ID is automatically generated as SERIAL (auto-incrementing integer starting from 1)
-- Each class will have a unique Class_ID that increments automatically

