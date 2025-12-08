-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#D946EF',
  student_term TEXT DEFAULT 'Students',
  tutor_term TEXT DEFAULT 'Tutors',
  lesson_term TEXT DEFAULT 'Lessons',
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  subscription_plan TEXT DEFAULT 'trial',
  flutterwave_customer_id TEXT,
  flutterwave_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_members junction table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Function to check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Function to check if user is org admin/owner
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND (role = 'admin' OR is_owner = true)
  )
$$;

-- RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations FOR SELECT
USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Org admins can update their organization"
ON public.organizations FOR UPDATE
USING (public.is_org_admin(auth.uid(), id));

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for organization_members
CREATE POLICY "Members can view their organization members"
ON public.organization_members FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage members"
ON public.organization_members FOR INSERT
WITH CHECK (public.is_org_admin(auth.uid(), organization_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can update members"
ON public.organization_members FOR UPDATE
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can remove members"
ON public.organization_members FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Add organization_id to all existing tables
ALTER TABLE public.students ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tutors ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.lessons ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.lesson_recurrence_rules ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.crm_leads ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.message_templates ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.message_recipients ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.automated_reminders ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tutor_payroll ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.staff ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.staff_payroll ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tutor_documents ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notification_preferences ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Drop existing policies and create new org-scoped policies for students
DROP POLICY IF EXISTS "Authenticated users can view all students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can create students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Org members can view students"
ON public.students FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create students"
ON public.students FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update students"
ON public.students FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete students"
ON public.students FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for tutors
DROP POLICY IF EXISTS "Authenticated users can view all tutors" ON public.tutors;
DROP POLICY IF EXISTS "Authenticated users can create tutors" ON public.tutors;
DROP POLICY IF EXISTS "Authenticated users can update tutors" ON public.tutors;
DROP POLICY IF EXISTS "Authenticated users can delete tutors" ON public.tutors;

CREATE POLICY "Org members can view tutors"
ON public.tutors FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create tutors"
ON public.tutors FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update tutors"
ON public.tutors FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete tutors"
ON public.tutors FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for lessons
DROP POLICY IF EXISTS "Authenticated users can view all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can create lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can delete lessons" ON public.lessons;

CREATE POLICY "Org members can view lessons"
ON public.lessons FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create lessons"
ON public.lessons FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update lessons"
ON public.lessons FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete lessons"
ON public.lessons FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for payments
DROP POLICY IF EXISTS "Authenticated users can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.payments;

CREATE POLICY "Org members can view payments"
ON public.payments FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create payments"
ON public.payments FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update payments"
ON public.payments FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete payments"
ON public.payments FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for attendance
DROP POLICY IF EXISTS "Authenticated users can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;

CREATE POLICY "Org members can view attendance"
ON public.attendance FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create attendance"
ON public.attendance FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update attendance"
ON public.attendance FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete attendance"
ON public.attendance FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for expenses
DROP POLICY IF EXISTS "Authenticated users can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

CREATE POLICY "Org members can view expenses"
ON public.expenses FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update expenses"
ON public.expenses FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete expenses"
ON public.expenses FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for crm_leads
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.crm_leads;

CREATE POLICY "Org members can view leads"
ON public.crm_leads FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create leads"
ON public.crm_leads FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update leads"
ON public.crm_leads FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete leads"
ON public.crm_leads FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for messages
DROP POLICY IF EXISTS "Authenticated users can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON public.messages;

CREATE POLICY "Org members can view messages"
ON public.messages FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create messages"
ON public.messages FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update messages"
ON public.messages FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete messages"
ON public.messages FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Drop existing policies and create new org-scoped policies for notifications
DROP POLICY IF EXISTS "Authenticated users can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can delete notifications" ON public.notifications;

CREATE POLICY "Org members can view notifications"
ON public.notifications FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update notifications"
ON public.notifications FOR UPDATE
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete notifications"
ON public.notifications FOR DELETE
USING (public.is_org_admin(auth.uid(), organization_id));

-- Create indexes for performance
CREATE INDEX idx_students_org ON public.students(organization_id);
CREATE INDEX idx_tutors_org ON public.tutors(organization_id);
CREATE INDEX idx_lessons_org ON public.lessons(organization_id);
CREATE INDEX idx_payments_org ON public.payments(organization_id);
CREATE INDEX idx_attendance_org ON public.attendance(organization_id);
CREATE INDEX idx_expenses_org ON public.expenses(organization_id);
CREATE INDEX idx_crm_leads_org ON public.crm_leads(organization_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

-- Trigger to update updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();