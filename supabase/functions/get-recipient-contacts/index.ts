import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecipientContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: string;
  amount?: string;
  date?: string;
  subject?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Extract JWT token from "Bearer <token>"
    const jwt = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        }
      }
    );

    // Pass JWT directly to getUser
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("User not authenticated");
    }

    const { recipientType, channel } = await req.json();

    console.log(`Fetching contacts for: ${recipientType}, channel: ${channel}`);
    console.log('Authenticated user ID:', user.id);
    let contacts: RecipientContact[] = [];

    switch (recipientType) {
      case "all-students": {
        console.log('Querying students with user_id:', user.id);
        const { data: students, error } = await supabaseClient
          .from("students")
          .select("id, name, email, phone, parent_email, parent_phone, subjects")
          .eq("user_id", user.id)
          .eq("status", "active");
        
        console.log('Students query result:', { count: students?.length, error });
        if (error) {
          console.error('Students query error:', error);
          throw error;
        }

        contacts = students.map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          type: "student",
          subject: student.subjects?.[0] || "",
        }));
        break;
      }

      case "all-parents": {
        const { data: students, error } = await supabaseClient
          .from("students")
          .select("id, parent_name, parent_email, parent_phone, subjects")
          .eq("user_id", user.id)
          .eq("status", "active")
          .not("parent_email", "is", null);

        if (error) throw error;

        contacts = students
          .filter((s) => s.parent_name && (s.parent_email || s.parent_phone))
          .map((student) => ({
            id: student.id,
            name: student.parent_name,
            email: student.parent_email,
            phone: student.parent_phone,
            type: "parent",
            subject: student.subjects?.[0] || "",
          }));
        break;
      }

      case "all-tutors": {
        const { data: tutors, error } = await supabaseClient
          .from("tutors")
          .select("id, name, email, phone")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (error) throw error;

        contacts = tutors.map((tutor) => ({
          id: tutor.id,
          name: tutor.name,
          email: tutor.email,
          phone: tutor.phone,
          type: "tutor",
        }));
        break;
      }

      case "all-staff": {
        const { data: staff, error } = await supabaseClient
          .from("staff")
          .select("id, name, email, phone")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (error) throw error;

        contacts = staff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          type: "staff",
        }));
        break;
      }

      case "pending-payments": {
        console.log('Fetching pending payments for user:', user.id);
        const { data: payments, error } = await supabaseClient
          .from("payments")
          .select(
            `
            id,
            student_id,
            amount,
            due_date,
            students!inner (
              id,
              name,
              email,
              phone,
              parent_email,
              parent_phone,
              subjects
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("status", "pending");

        console.log('Payments query result:', { count: payments?.length, error });
        if (error) {
          console.error('Payments query error:', error);
          throw error;
        }

        const uniqueStudents = new Map();
        payments?.forEach((payment: any) => {
          const student = payment.students;
          if (student && !uniqueStudents.has(student.id)) {
            uniqueStudents.set(student.id, {
              id: student.id,
              name: student.name,
              email: student.email || student.parent_email,
              phone: student.phone || student.parent_phone,
              type: "student",
              amount: payment.amount ? `GHS ${payment.amount}` : "",
              date: payment.due_date ? new Date(payment.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "",
              subject: student.subjects?.[0] || "",
            });
          }
        });

        console.log('Unique students from payments:', uniqueStudents.size);
        contacts = Array.from(uniqueStudents.values());
        break;
      }

      default:
        throw new Error(`Unknown recipient type: ${recipientType}`);
    }

    console.log('Total contacts before filtering:', contacts.length);
    console.log('Sample contact:', contacts[0]);
    
    // Filter by channel and set contact field
    const filteredContacts = contacts
      .filter((contact) => {
        const hasEmail = contact.email && contact.email.trim() !== "";
        const hasPhone = contact.phone && contact.phone.trim() !== "";
        
        if (channel === "email") {
          return hasEmail;
        } else if (channel === "sms") {
          return hasPhone;
        }
        return true;
      })
      .map((contact) => {
        const mapped = {
          ...contact,
          contact: channel === "email" ? contact.email || "" : contact.phone || "",
        };
        console.log('Mapped contact:', mapped);
        return mapped;
      });

    return new Response(
      JSON.stringify({
        success: true,
        contacts: filteredContacts,
        count: filteredContacts.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Error in get-recipient-contacts function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Unknown error",
        details: error.toString()
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
