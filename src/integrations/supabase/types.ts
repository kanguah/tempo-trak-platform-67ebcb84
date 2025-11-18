export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          lesson_date: string
          lesson_id: string | null
          rating: number | null
          start_time: string
          status: string
          student_id: string | null
          subject: string
          tutor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          lesson_date: string
          lesson_id?: string | null
          rating?: number | null
          start_time: string
          status?: string
          student_id?: string | null
          subject: string
          tutor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          lesson_date?: string
          lesson_id?: string | null
          rating?: number | null
          start_time?: string
          status?: string
          student_id?: string | null
          subject?: string
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_reminders: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          template_id: string | null
          times_sent: number
          trigger_type: string
          trigger_value: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          template_id?: string | null
          times_sent?: number
          trigger_type: string
          trigger_value: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          template_id?: string | null
          times_sent?: number
          trigger_type?: string
          trigger_value?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_reminders_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          original_stage: string | null
          phone: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          original_stage?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          original_stage?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          paid_by: string | null
          payment_method: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category: string
          created_at?: string
          description?: string | null
          expense_date: string
          id?: string
          paid_by?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          paid_by?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          day_of_week: number
          duration: number
          id: string
          lesson_date: string | null
          notes: string | null
          room: string | null
          start_time: string
          status: string
          student_id: string | null
          subject: string
          tutor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          duration?: number
          id?: string
          lesson_date?: string | null
          notes?: string | null
          room?: string | null
          start_time: string
          status?: string
          student_id?: string | null
          subject: string
          tutor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          duration?: number
          id?: string
          lesson_date?: string | null
          notes?: string | null
          room?: string | null
          start_time?: string
          status?: string
          student_id?: string | null
          subject?: string
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          message_id: string
          recipient_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          message_id: string
          recipient_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          message_id?: string
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "message_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_error: string | null
          delivery_status: string
          id: string
          message_id: string
          recipient_contact: string
          recipient_id: string | null
          recipient_name: string
          recipient_type: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: string
          id?: string
          message_id: string
          recipient_contact: string
          recipient_id?: string | null
          recipient_name: string
          recipient_type: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: string
          id?: string
          message_id?: string
          recipient_contact?: string
          recipient_id?: string | null
          recipient_name?: string
          recipient_type?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string
          channel: string
          created_at: string
          id: string
          message: string
          name: string
          subject: string | null
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          category: string
          channel: string
          created_at?: string
          id?: string
          message: string
          name: string
          subject?: string | null
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          category?: string
          channel?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel: string
          created_at: string
          id: string
          message_body: string
          recipient_type: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          message_body: string
          recipient_type: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message_body?: string
          recipient_type?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          marketing_updates: boolean
          new_enrollments: boolean
          payment_reminders: boolean
          schedule_changes: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marketing_updates?: boolean
          new_enrollments?: boolean
          payment_reminders?: boolean
          schedule_changes?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marketing_updates?: boolean
          new_enrollments?: boolean
          payment_reminders?: boolean
          schedule_changes?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          package_type: string | null
          payment_date: string | null
          reminder_sent: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          package_type?: string | null
          payment_date?: string | null
          reminder_sent?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          package_type?: string | null
          payment_date?: string | null
          reminder_sent?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string | null
          email: string | null
          hire_date: string | null
          id: string
          monthly_salary: number
          name: string
          phone: string | null
          position: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          monthly_salary?: number
          name: string
          phone?: string | null
          position: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          monthly_salary?: number
          name?: string
          phone?: string | null
          position?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_payroll: {
        Row: {
          base_salary: number
          bonuses: number | null
          created_at: string | null
          deductions: number | null
          id: string
          month: string
          notes: string | null
          payment_date: string | null
          staff_id: string | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_salary?: number
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          id?: string
          month: string
          notes?: string | null
          payment_date?: string | null
          staff_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_salary?: number
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          id?: string
          month?: string
          notes?: string | null
          payment_date?: string | null
          staff_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          discount_end_date: string | null
          discount_percentage: number | null
          email: string | null
          enrollment_date: string
          final_monthly_fee: number | null
          grade: string | null
          id: string
          last_payment_date: string | null
          monthly_fee: number | null
          name: string
          package_type: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          payment_status: string | null
          phone: string | null
          schedule: Json | null
          status: string
          subjects: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          discount_end_date?: string | null
          discount_percentage?: number | null
          email?: string | null
          enrollment_date?: string
          final_monthly_fee?: number | null
          grade?: string | null
          id?: string
          last_payment_date?: string | null
          monthly_fee?: number | null
          name: string
          package_type?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          payment_status?: string | null
          phone?: string | null
          schedule?: Json | null
          status?: string
          subjects?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          discount_end_date?: string | null
          discount_percentage?: number | null
          email?: string | null
          enrollment_date?: string
          final_monthly_fee?: number | null
          grade?: string | null
          id?: string
          last_payment_date?: string | null
          monthly_fee?: number | null
          name?: string
          package_type?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          payment_status?: string | null
          phone?: string | null
          schedule?: Json | null
          status?: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_documents: {
        Row: {
          category: string
          created_at: string
          file_size: string
          file_type: string
          file_url: string
          id: string
          name: string
          tutor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_size: string
          file_type: string
          file_url: string
          id?: string
          name: string
          tutor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          file_size?: string
          file_type?: string
          file_url?: string
          id?: string
          name?: string
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_documents_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_payroll: {
        Row: {
          active_students: number
          base_salary: number
          bonuses: number
          created_at: string
          deductions: number
          id: string
          lesson_bonus: number | null
          lessons_taught: number
          month: string
          notes: string | null
          payment_date: string | null
          status: string
          student_bonus: number | null
          total_amount: number
          tutor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_students?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          id?: string
          lesson_bonus?: number | null
          lessons_taught?: number
          month: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          student_bonus?: number | null
          total_amount?: number
          tutor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_students?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          deductions?: number
          id?: string
          lesson_bonus?: number | null
          lessons_taught?: number
          month?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          student_bonus?: number | null
          total_amount?: number
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_payroll_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutors: {
        Row: {
          availability: string | null
          created_at: string
          email: string | null
          id: string
          monthly_salary: number | null
          name: string
          phone: string | null
          status: string
          subjects: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_salary?: number | null
          name: string
          phone?: string | null
          status?: string
          subjects?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_salary?: number | null
          name?: string
          phone?: string | null
          status?: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tutor" | "student" | "user"
      lead_stage: "new" | "contacted" | "qualified" | "converted" | "lost"
      notification_type:
        | "payment_reminder"
        | "schedule_change"
        | "new_enrollment"
        | "marketing"
      payment_status: "pending" | "completed" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "tutor", "student", "user"],
      lead_stage: ["new", "contacted", "qualified", "converted", "lost"],
      notification_type: [
        "payment_reminder",
        "schedule_change",
        "new_enrollment",
        "marketing",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
