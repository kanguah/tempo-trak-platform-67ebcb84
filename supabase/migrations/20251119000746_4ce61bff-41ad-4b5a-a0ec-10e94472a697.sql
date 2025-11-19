-- Add paid_amount column to payments table to track actual amount paid
ALTER TABLE public.payments 
ADD COLUMN paid_amount numeric DEFAULT NULL;

-- For existing completed payments, set paid_amount equal to amount
UPDATE public.payments 
SET paid_amount = amount 
WHERE status = 'completed' AND paid_amount IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.payments.paid_amount IS 'Tracks the actual amount paid. For full payments this equals amount, for partial payments this is less than amount';