-- Add payment_reference column to payments table
ALTER TABLE public.payments 
ADD COLUMN payment_reference text;