-- Add column to store original stage before archiving
ALTER TABLE public.crm_leads 
ADD COLUMN original_stage text;