-- Make email column nullable in crm_leads table to allow imports without email
ALTER TABLE crm_leads ALTER COLUMN email DROP NOT NULL;