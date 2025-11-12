-- Add rating column to attendance table for student satisfaction tracking
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS rating integer;

ALTER TABLE public.attendance 
ADD CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5);

-- Create tutor_payroll table for payroll management
CREATE TABLE public.tutor_payroll (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  month text NOT NULL,
  hours_worked numeric NOT NULL DEFAULT 0,
  hourly_rate numeric NOT NULL DEFAULT 0,
  bonuses numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tutor_payroll
ALTER TABLE public.tutor_payroll ENABLE ROW LEVEL SECURITY;

-- RLS policies for tutor_payroll
CREATE POLICY "Users can view their own payroll records"
ON public.tutor_payroll FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payroll records"
ON public.tutor_payroll FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payroll records"
ON public.tutor_payroll FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payroll records"
ON public.tutor_payroll FOR DELETE
USING (auth.uid() = user_id);

-- Create tutor_documents table for document management
CREATE TABLE public.tutor_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tutor_documents
ALTER TABLE public.tutor_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for tutor_documents
CREATE POLICY "Users can view their own documents"
ON public.tutor_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
ON public.tutor_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.tutor_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.tutor_documents FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_tutor_payroll_updated_at
BEFORE UPDATE ON public.tutor_payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutor_documents_updated_at
BEFORE UPDATE ON public.tutor_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();