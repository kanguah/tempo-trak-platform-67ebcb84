import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type NotificationType = 
  | "payment_reminder" 
  | "schedule_change" 
  | "new_enrollment" 
  | "marketing"
  | "lead_update"
  | "attendance_update"
  | "expense_update"
  | "message_sent"
  | "lesson_update";

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
}

export function useCreateNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, title, message }: CreateNotificationParams) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Utility function for creating notifications without React Query (for use in other mutations)
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    is_read: false,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}
