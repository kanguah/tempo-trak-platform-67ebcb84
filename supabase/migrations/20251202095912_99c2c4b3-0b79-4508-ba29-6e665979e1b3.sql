-- Create lesson recurrence rules table
CREATE TABLE public.lesson_recurrence_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  subject TEXT NOT NULL,
  room TEXT,
  recurrence_type TEXT NOT NULL DEFAULT 'weekly',
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.lesson_recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurrence rules"
  ON public.lesson_recurrence_rules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurrence rules"
  ON public.lesson_recurrence_rules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurrence rules"
  ON public.lesson_recurrence_rules
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurrence rules"
  ON public.lesson_recurrence_rules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_recurrence_rules_updated_at
  BEFORE UPDATE ON public.lesson_recurrence_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add recurrence_rule_id to lessons table to link generated instances
ALTER TABLE public.lessons
ADD COLUMN recurrence_rule_id UUID REFERENCES public.lesson_recurrence_rules(id) ON DELETE SET NULL;