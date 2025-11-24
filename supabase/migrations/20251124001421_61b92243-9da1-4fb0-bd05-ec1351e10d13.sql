-- Add last_contacted_at column to crm_leads table
ALTER TABLE public.crm_leads 
ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_crm_leads_last_contacted ON public.crm_leads(last_contacted_at);