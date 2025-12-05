-- Update students table policies
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
DROP POLICY IF EXISTS "Users can create their own students" ON public.students;
DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;

CREATE POLICY "Authenticated users can view all students" ON public.students FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create students" ON public.students FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update tutors table policies
DROP POLICY IF EXISTS "Users can view their own tutors" ON public.tutors;
DROP POLICY IF EXISTS "Users can create their own tutors" ON public.tutors;
DROP POLICY IF EXISTS "Users can update their own tutors" ON public.tutors;
DROP POLICY IF EXISTS "Users can delete their own tutors" ON public.tutors;

CREATE POLICY "Authenticated users can view all tutors" ON public.tutors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create tutors" ON public.tutors FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update tutors" ON public.tutors FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete tutors" ON public.tutors FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update payments table policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

CREATE POLICY "Authenticated users can view all payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update payments" ON public.payments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete payments" ON public.payments FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update lessons table policies
DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can create their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can update their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON public.lessons;

CREATE POLICY "Authenticated users can view all lessons" ON public.lessons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lessons" ON public.lessons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update lessons" ON public.lessons FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete lessons" ON public.lessons FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update attendance table policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can create their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete their own attendance" ON public.attendance;

CREATE POLICY "Authenticated users can view all attendance" ON public.attendance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update expenses table policies
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

CREATE POLICY "Authenticated users can view all expenses" ON public.expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update lesson_recurrence_rules table policies
DROP POLICY IF EXISTS "Users can view their own recurrence rules" ON public.lesson_recurrence_rules;
DROP POLICY IF EXISTS "Users can create their own recurrence rules" ON public.lesson_recurrence_rules;
DROP POLICY IF EXISTS "Users can update their own recurrence rules" ON public.lesson_recurrence_rules;
DROP POLICY IF EXISTS "Users can delete their own recurrence rules" ON public.lesson_recurrence_rules;

CREATE POLICY "Authenticated users can view all recurrence rules" ON public.lesson_recurrence_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create recurrence rules" ON public.lesson_recurrence_rules FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update recurrence rules" ON public.lesson_recurrence_rules FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete recurrence rules" ON public.lesson_recurrence_rules FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update tutor_documents table policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.tutor_documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.tutor_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.tutor_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.tutor_documents;

CREATE POLICY "Authenticated users can view all documents" ON public.tutor_documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create documents" ON public.tutor_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update documents" ON public.tutor_documents FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete documents" ON public.tutor_documents FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update tutor_payroll table policies
DROP POLICY IF EXISTS "Users can view their own payroll records" ON public.tutor_payroll;
DROP POLICY IF EXISTS "Users can create their own payroll records" ON public.tutor_payroll;
DROP POLICY IF EXISTS "Users can update their own payroll records" ON public.tutor_payroll;
DROP POLICY IF EXISTS "Users can delete their own payroll records" ON public.tutor_payroll;

CREATE POLICY "Authenticated users can view all payroll records" ON public.tutor_payroll FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create payroll records" ON public.tutor_payroll FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update payroll records" ON public.tutor_payroll FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete payroll records" ON public.tutor_payroll FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update crm_leads table policies
DROP POLICY IF EXISTS "Users can view their own leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.crm_leads;

CREATE POLICY "Authenticated users can view all leads" ON public.crm_leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create leads" ON public.crm_leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update leads" ON public.crm_leads FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete leads" ON public.crm_leads FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update messages table policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Authenticated users can view all messages" ON public.messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update messages" ON public.messages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete messages" ON public.messages FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update message_templates table policies
DROP POLICY IF EXISTS "Users can view their own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.message_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.message_templates;

CREATE POLICY "Authenticated users can view all templates" ON public.message_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create templates" ON public.message_templates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update templates" ON public.message_templates FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete templates" ON public.message_templates FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update message_recipients table policies
DROP POLICY IF EXISTS "Users can view their own message recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Users can create their own message recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Users can update their own message recipients" ON public.message_recipients;

CREATE POLICY "Authenticated users can view all message recipients" ON public.message_recipients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create message recipients" ON public.message_recipients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update message recipients" ON public.message_recipients FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete message recipients" ON public.message_recipients FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update message_logs table policies
DROP POLICY IF EXISTS "Users can view their own message logs" ON public.message_logs;

CREATE POLICY "Authenticated users can view all message logs" ON public.message_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create message logs" ON public.message_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update automated_reminders table policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.automated_reminders;
DROP POLICY IF EXISTS "Users can create their own reminders" ON public.automated_reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.automated_reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.automated_reminders;

CREATE POLICY "Authenticated users can view all reminders" ON public.automated_reminders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create reminders" ON public.automated_reminders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update reminders" ON public.automated_reminders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete reminders" ON public.automated_reminders FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Authenticated users can view all notifications" ON public.notifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update notifications" ON public.notifications FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete notifications" ON public.notifications FOR DELETE USING (auth.uid() IS NOT NULL);

-- Update notification_preferences table policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;

CREATE POLICY "Authenticated users can view all preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() IS NOT NULL);