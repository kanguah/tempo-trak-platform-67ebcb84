import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipientContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { recipientType, channel } = await req.json();

    console.log(`Fetching contacts for: ${recipientType}, channel: ${channel}`);

    let contacts: RecipientContact[] = [];

    switch (recipientType) {
      case 'all-students': {
        const { data: students, error } = await supabaseClient
          .from('students')
          .select('id, name, email, phone, parent_email, parent_phone')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;

        contacts = students.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          type: 'student',
        }));
        break;
      }

      case 'all-parents': {
        const { data: students, error } = await supabaseClient
          .from('students')
          .select('id, parent_name, parent_email, parent_phone')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .not('parent_email', 'is', null);

        if (error) throw error;

        contacts = students
          .filter(s => s.parent_name && (s.parent_email || s.parent_phone))
          .map(student => ({
            id: student.id,
            name: student.parent_name,
            email: student.parent_email,
            phone: student.parent_phone,
            type: 'parent',
          }));
        break;
      }

      case 'all-tutors': {
        const { data: tutors, error } = await supabaseClient
          .from('tutors')
          .select('id, name, email, phone')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;

        contacts = tutors.map(tutor => ({
          id: tutor.id,
          name: tutor.name,
          email: tutor.email,
          phone: tutor.phone,
          type: 'tutor',
        }));
        break;
      }

      case 'all-staff': {
        const { data: staff, error } = await supabaseClient
          .from('staff')
          .select('id, name, email, phone')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;

        contacts = staff.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          type: 'staff',
        }));
        break;
      }

      case 'pending-payments': {
        const { data: payments, error } = await supabaseClient
          .from('payments')
          .select(`
            id,
            student_id,
            students!inner (
              id,
              name,
              email,
              phone,
              parent_email,
              parent_phone
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending');

        if (error) throw error;

        const uniqueStudents = new Map();
        payments?.forEach((payment: any) => {
          const student = payment.students;
          if (student && !uniqueStudents.has(student.id)) {
            uniqueStudents.set(student.id, {
              id: student.id,
              name: student.name,
              email: student.email || student.parent_email,
              phone: student.phone || student.parent_phone,
              type: 'student',
            });
          }
        });

        contacts = Array.from(uniqueStudents.values());
        break;
      }

      default:
        throw new Error(`Unknown recipient type: ${recipientType}`);
    }

    // Filter by channel - only return contacts that have the appropriate contact info
    const filteredContacts = contacts.filter(contact => {
      if (channel === 'email') {
        return contact.email && contact.email.trim() !== '';
      } else if (channel === 'sms') {
        return contact.phone && contact.phone.trim() !== '';
      }
      return true;
    });

    console.log(`Found ${filteredContacts.length} contacts for ${recipientType}`);

    return new Response(
      JSON.stringify({
        success: true,
        contacts: filteredContacts,
        count: filteredContacts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in get-recipient-contacts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
