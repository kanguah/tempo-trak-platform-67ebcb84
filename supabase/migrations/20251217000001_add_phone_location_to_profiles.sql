-- Add phone and location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update RLS policies to include the new columns (they should already be covered by existing policies)
-- No additional RLS changes needed as existing policies cover all columns
