-- Create message_templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject TEXT,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('payment', 'lesson', 'general')),
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_templates
CREATE POLICY "Users can view their own templates"
ON public.message_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.message_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.message_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.message_templates FOR DELETE
USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject TEXT,
  message_body TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = user_id);

-- Create message_recipients table
CREATE TABLE public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_contact TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  delivery_error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_recipients
CREATE POLICY "Users can view their own message recipients"
ON public.message_recipients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_recipients.message_id
    AND messages.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own message recipients"
ON public.message_recipients FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_recipients.message_id
    AND messages.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own message recipients"
ON public.message_recipients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_recipients.message_id
    AND messages.user_id = auth.uid()
  )
);

-- Create automated_reminders table
CREATE TABLE public.automated_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lesson', 'payment', 'general')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  trigger_value INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automated_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for automated_reminders
CREATE POLICY "Users can view their own reminders"
ON public.automated_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.automated_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.automated_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.automated_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Create message_logs table
CREATE TABLE public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.message_recipients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'failed', 'bounced')),
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_logs
CREATE POLICY "Users can view their own message logs"
ON public.message_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_logs.message_id
    AND messages.user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_reminders_updated_at
BEFORE UPDATE ON public.automated_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();