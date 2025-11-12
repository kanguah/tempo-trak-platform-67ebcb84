-- Add lesson_date column to lessons table for specific lesson dates
ALTER TABLE public.lessons
ADD COLUMN lesson_date DATE;

-- Add an index for better query performance on lesson_date
CREATE INDEX idx_lessons_lesson_date ON public.lessons(lesson_date);