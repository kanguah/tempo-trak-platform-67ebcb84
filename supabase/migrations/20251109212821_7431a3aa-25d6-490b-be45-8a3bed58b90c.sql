-- Add date of birth and parental information columns to students table
ALTER TABLE public.students
ADD COLUMN date_of_birth DATE,
ADD COLUMN parent_name TEXT,
ADD COLUMN parent_email TEXT,
ADD COLUMN parent_phone TEXT,
ADD COLUMN address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.students.date_of_birth IS 'Student date of birth';
COMMENT ON COLUMN public.students.parent_name IS 'Parent or guardian full name';
COMMENT ON COLUMN public.students.parent_email IS 'Parent or guardian email address';
COMMENT ON COLUMN public.students.parent_phone IS 'Parent or guardian phone number';
COMMENT ON COLUMN public.students.address IS 'Student residential address';