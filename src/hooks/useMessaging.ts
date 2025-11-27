import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  channel: 'email' | 'sms';
  subject?: string;
  message: string;
  category: 'payment' | 'lesson' | 'general';
  variables?: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  template_id?: string;
  channel: 'email' | 'sms';
  subject?: string;
  message_body: string;
  recipient_type: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  message_recipients?: MessageRecipient[];
}

export interface MessageRecipient {
  id: string;
  message_id: string;
  recipient_type: string;
  recipient_id?: string;
  recipient_name: string;
  recipient_contact: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  delivery_error?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface AutomatedReminder {
  id: string;
  user_id: string;
  name: string;
  type: 'lesson' | 'payment' | 'general';
  channel: 'email' | 'sms';
  template_id?: string;
  trigger_type: string;
  trigger_value: number;
  is_active: boolean;
  times_sent: number;
  created_at: string;
  updated_at: string;
}

// Templates
export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MessageTemplate[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("message_templates")
        .insert({ ...template, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Template created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating template", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MessageTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("message_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Template updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating template", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting template", description: error.message, variant: "destructive" });
    },
  });
}

// Messages
export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          message_recipients (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
  });
}

export function useGetRecipientContacts() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ recipientType, channel }: { recipientType: string; channel: string }) => {
      const { data, error } = await supabase.functions.invoke("get-recipient-contacts", {
        body: { recipientType, channel },
      });

      if (error) throw error;
      return data.contacts;
    },
    onError: (error: Error) => {
      toast({ title: "Error fetching contacts", description: error.message, variant: "destructive" });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      channel,
      subject,
      messageBody,
      recipients,
      templateId,
      recipientType,
    }: {
      channel: 'email' | 'sms';
      subject?: string;
      messageBody: string;
      recipients: any[];
      templateId?: string;
      recipientType: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Debug: Preparing to send message", {
        channel,
        subject,
        messageBody,
        recipients,
        templateId,
        recipientType,
      });
      // Create message record
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          template_id: templateId,
          channel,
          subject,
          message_body: messageBody,
          recipient_type: recipientType,
          status: 'draft',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Send message via edge function
      const { data, error } = await supabase.functions.invoke("send-message", {
        body: {
          messageId: message.id,
          channel,
          subject,
          messageBody,
          recipients: recipients.map(r => ({
            name: r.name,
            contact: r.contact,
            type: r.type,
            recipientId: r.id,
          })),
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({ 
        title: "Messages sent", 
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error sending messages", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

// Automated Reminders
export function useAutomatedReminders() {
  return useQuery({
    queryKey: ["automated-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_reminders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AutomatedReminder[];
    },
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("automated_reminders")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-reminders"] });
      toast({ title: "Reminder updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating reminder", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reminder: Omit<AutomatedReminder, 'id' | 'user_id' | 'times_sent' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("automated_reminders")
        .insert({ ...reminder, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-reminders"] });
      toast({ title: "Reminder created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating reminder", description: error.message, variant: "destructive" });
    },
  });
}
