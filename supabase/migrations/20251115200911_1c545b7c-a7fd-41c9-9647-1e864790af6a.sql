-- Add notes column to tutor_payroll table for parity with staff_payroll
ALTER TABLE tutor_payroll 
ADD COLUMN notes text;