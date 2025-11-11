-- Update students table with package and payment information (only add columns that don't exist)
DO $$ 
BEGIN
  -- Add package_type if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='package_type') THEN
    ALTER TABLE public.students ADD COLUMN package_type TEXT;
  END IF;
  
  -- Add monthly_fee if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='monthly_fee') THEN
    ALTER TABLE public.students ADD COLUMN monthly_fee NUMERIC;
  END IF;
  
  -- Add discount_percentage if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='discount_percentage') THEN
    ALTER TABLE public.students ADD COLUMN discount_percentage NUMERIC DEFAULT 0;
  END IF;
  
  -- Add discount_end_date if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='discount_end_date') THEN
    ALTER TABLE public.students ADD COLUMN discount_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add final_monthly_fee if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='final_monthly_fee') THEN
    ALTER TABLE public.students ADD COLUMN final_monthly_fee NUMERIC;
  END IF;
  
  -- Add last_payment_date if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='last_payment_date') THEN
    ALTER TABLE public.students ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add payment_status if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='payment_status') THEN
    ALTER TABLE public.students ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Update payments table with reminder tracking
DO $$ 
BEGIN
  -- Add discount_amount if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='discount_amount') THEN
    ALTER TABLE public.payments ADD COLUMN discount_amount NUMERIC DEFAULT 0;
  END IF;
  
  -- Add reminder_sent if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='reminder_sent') THEN
    ALTER TABLE public.payments ADD COLUMN reminder_sent JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Add package_type if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='package_type') THEN
    ALTER TABLE public.payments ADD COLUMN package_type TEXT;
  END IF;
END $$;

-- Create indexes for faster queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_students_payment_status ON public.students(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);