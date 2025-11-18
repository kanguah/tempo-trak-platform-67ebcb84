-- Allow NULL values for email columns in students, tutors, and staff tables
ALTER TABLE public.students ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.tutors ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.staff ALTER COLUMN email DROP NOT NULL;