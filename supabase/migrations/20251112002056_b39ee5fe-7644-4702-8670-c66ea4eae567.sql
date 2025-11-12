-- Add schedule column to students table to store their weekly schedule
ALTER TABLE public.students
ADD COLUMN schedule jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.students.schedule IS 'Weekly schedule as array of {day: number (0-6), time: string (HH:MM)}';
