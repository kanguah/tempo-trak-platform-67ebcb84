-- Add unique constraint to prevent duplicate attendance records for the same lesson on the same date
ALTER TABLE attendance 
ADD CONSTRAINT attendance_lesson_date_unique 
UNIQUE (lesson_id, lesson_date);