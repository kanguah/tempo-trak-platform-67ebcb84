-- Update students table with package and payment information
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_monthly_fee NUMERIC,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add check constraint for package types
ALTER TABLE public.students
ADD CONSTRAINT valid_package_type 
CHECK (package_type IN ('1x Weekly', '2x Weekly', '3x Weekly') OR package_type IS NULL);

-- Add check constraint for payment status
ALTER TABLE public.students
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('paid', 'pending', 'overdue'));

-- Update payments table with reminder tracking
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reminder_sent JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS package_type TEXT;

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  paid_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraints for expenses
ALTER TABLE public.expenses
ADD CONSTRAINT valid_expense_category 
CHECK (category IN ('Tutor Salaries', 'Facility Rent', 'Marketing', 'Equipment', 'Utilities', 'Other'));

ALTER TABLE public.expenses
ADD CONSTRAINT valid_expense_status 
CHECK (status IN ('paid', 'pending'));

-- Enable RLS on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
ON public.expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON public.expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON public.expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for expenses updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_students_payment_status ON public.students(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);