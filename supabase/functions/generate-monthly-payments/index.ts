import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting monthly payment generation...');

    // Get all active students with package information
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'active')
      .not('package_type', 'is', null)
      .not('final_monthly_fee', 'is', null);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw studentsError;
    }

    console.log(`Found ${students.length} students with packages`);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const dueDate = new Date(currentYear, currentMonth, 15); // 15th of current month
    
    let paymentsCreated = 0;
    let paymentsSkipped = 0;

    for (const student of students) {
      // Check if payment already exists for this month
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('student_id', student.id)
        .eq('user_id', student.user_id)
        .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
        .lte('created_at', new Date(currentYear, currentMonth + 1, 0).toISOString())
        .single();

      if (existingPayment) {
        console.log(`Payment already exists for student ${student.name}`);
        paymentsSkipped++;
        continue;
      }

      // Create payment record
      const monthName = dueDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: student.user_id,
          student_id: student.id,
          amount: student.final_monthly_fee,
          discount_amount: student.discount_percentage 
            ? (student.monthly_fee * student.discount_percentage / 100) 
            : 0,
          package_type: student.package_type,
          status: 'pending',
          due_date: dueDate.toISOString(),
          description: `Monthly Fee - ${student.package_type} - ${monthName}`,
        });

      if (insertError) {
        console.error(`Error creating payment for student ${student.name}:`, insertError);
        continue;
      }

      // Update student payment status
      await supabase
        .from('students')
        .update({ payment_status: 'pending' })
        .eq('id', student.id);

      console.log(`Created payment for student ${student.name}`);
      paymentsCreated++;
    }

    console.log(`Payment generation complete: ${paymentsCreated} created, ${paymentsSkipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        paymentsCreated,
        paymentsSkipped,
        totalStudents: students.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in generate-monthly-payments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});