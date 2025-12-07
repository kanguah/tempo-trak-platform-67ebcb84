-- Add new notification types to the enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lead_update';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'attendance_update';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'expense_update';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'message_sent';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lesson_update';