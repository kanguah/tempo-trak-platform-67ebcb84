-- Update tutors table: replace hourly_rate with monthly_salary
ALTER TABLE public.tutors DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS monthly_salary numeric DEFAULT 0;

-- Update tutor_payroll table structure
ALTER TABLE public.tutor_payroll DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.tutor_payroll DROP COLUMN IF EXISTS hours_worked;
ALTER TABLE public.tutor_payroll ADD COLUMN IF NOT EXISTS base_salary numeric NOT NULL DEFAULT 0;
ALTER TABLE public.tutor_payroll ADD COLUMN IF NOT EXISTS lessons_taught integer NOT NULL DEFAULT 0;
ALTER TABLE public.tutor_payroll ADD COLUMN IF NOT EXISTS active_students integer NOT NULL DEFAULT 0;
ALTER TABLE public.tutor_payroll ADD COLUMN IF NOT EXISTS lesson_bonus numeric DEFAULT 0;
ALTER TABLE public.tutor_payroll ADD COLUMN IF NOT EXISTS student_bonus numeric DEFAULT 0;

-- Create staff table for admin personnel
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  position text NOT NULL,
  monthly_salary numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  hire_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff (admin only)
CREATE POLICY "Admins can view all staff"
  ON public.staff FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create staff"
  ON public.staff FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update staff"
  ON public.staff FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete staff"
  ON public.staff FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for staff updated_at
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create staff_payroll table
CREATE TABLE IF NOT EXISTS public.staff_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  month text NOT NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  bonuses numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on staff_payroll table
ALTER TABLE public.staff_payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_payroll (admin only)
CREATE POLICY "Admins can view all staff payroll"
  ON public.staff_payroll FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create staff payroll"
  ON public.staff_payroll FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update staff payroll"
  ON public.staff_payroll FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete staff payroll"
  ON public.staff_payroll FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for staff_payroll updated_at
CREATE TRIGGER update_staff_payroll_updated_at
  BEFORE UPDATE ON public.staff_payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();