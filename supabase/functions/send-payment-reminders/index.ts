import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYMENT_INSTRUCTIONS = `
Payment Methods:

BANK TRANSFER:
Bank Name: GTBANK
Account Name: K.N.ANGUAH ENTERPRISE
Account No: 452135138140
Branch: KASOA

MOBILE MONEY TRANSFER:
Account Name: K.N.ANGUAH ENTERPRISE-KWEKU NYANKOM ANGUAH
Account Number: 0598614685

CASH PAYMENT:
Visit our facility at 49ice Music Academy
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const smsApiKey = Deno.env.get("SMSONLINEGH_API_KEY");
    const senderId = "49ice Music";

    // Get optional paymentId and force parameter from request body
    const { paymentId, force } = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    console.log("Starting payment reminders...", paymentId ? `for payment ${paymentId}` : "for all pending payments");
    if (force) {
      console.log("⚠️ FORCE MODE ENABLED - Will bypass 'already sent' checks");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build query for pending payments
    let query = supabase
      .from("payments")
      .select("*, students(*)")
      .in("status", ["pending", "failed"])
      .not("due_date", "is", null);

    // If paymentId is provided, filter by it
    if (paymentId) {
      query = query.eq("id", paymentId);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      throw paymentsError;
    }

    console.log(`Found ${payments.length} pending/overdue payments`);

    let remindersSent = 0;

    for (const payment of payments) {
      console.log(`\n📋 Processing payment ${payment.id}:`);
      console.log(`  Student: ${payment.students?.name}`);
      console.log(`  Amount: GH₵${payment.amount}`);
      
      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  Due Date: ${dueDate.toDateString()}`);
      console.log(`  Days Diff: ${daysDiff} (negative = overdue, positive = upcoming)`);

      const reminderSent = payment.reminder_sent || {};
      console.log(`  Previous Reminders:`, reminderSent);
      
      let reminderType = null;
      let emailSubject = "";
      let emailBody = "";
      let smsMessage = "";

      // Determine which reminder to send (with force override)
      if (daysDiff === 3 && (force || !reminderSent.three_days_before)) {
        console.log(`  ✓ Criteria met: 3 days before due date`);
        reminderType = "three_days_before";
        emailSubject = "Payment Reminder - Due in 3 Days";
        emailBody = `Dear ${payment.students?.parent_name || payment.students?.name},\n\nThis is a friendly reminder that your monthly payment for 49ice Music Academy is due in 3 days (on the 15th of this month).\n\nPayment Details:\n- Student: ${payment.students?.name}\n- Package: ${payment.package_type}\n- Amount Due: GH₵${payment.amount}\n- Due Date: 15th ${dueDate.toLocaleString("default", { month: "long", year: "numeric" })}\n\n${PAYMENT_INSTRUCTIONS}\n\nThank you for your continued support!\n\nBest regards,\n49ice Music Academy`;
        smsMessage = `Reminder: Your payment of GH₵${payment.amount} is due on 15th ${dueDate.toLocaleString("default", { month: "short" })}. Thank you!`;
      } else if (daysDiff === 0 && (force || !reminderSent.due_date)) {
        console.log(`  ✓ Criteria met: Due date is today`);
        reminderType = "due_date";
        emailSubject = "Payment Due Today";
        emailBody = `Dear ${payment.students?.parent_name || payment.students?.name},\n\nYour monthly payment for 49ice Music Academy is due today.\n\nAmount: GH₵${payment.amount}\nPackage: ${payment.package_type}\n\nPlease make your payment today to avoid overdue status.\n\n${PAYMENT_INSTRUCTIONS}\n\nThank you!\n49ice Music Academy`;
        smsMessage = `Payment Due: GH₵${payment.amount} for 49ice Academy is due today. Please pay to avoid overdue status.`;
      } else if (daysDiff === -3 && (force || !reminderSent.three_days_after)) {
        console.log(`  ✓ Criteria met: 3 days overdue`);
        reminderType = "three_days_after";
        emailSubject = "Overdue Payment Notice";
        emailBody = `Dear ${payment.students?.parent_name || payment.students?.name},\n\nWe notice that your payment of GH₵${payment.amount} was due on 15th but has not been received.\n\nPlease make your payment as soon as possible to keep your account in good standing.\n\n${PAYMENT_INSTRUCTIONS}\n\nIf you have already paid, please disregard this notice and contact us with payment confirmation.\n\nThank you for your prompt attention.\n49ice Music Academy`;
        smsMessage = `OVERDUE: Your payment of GH₵${payment.amount} was due on 15th. Please pay as soon as possible.`;

        // Update status to failed if 3 days overdue
        await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
      } else if (daysDiff === -7 && (force || !reminderSent.seven_days_after)) {
        console.log(`  ✓ Criteria met: 7 days overdue`);
        reminderType = "seven_days_after";
        emailSubject = "Urgent: Payment 7 Days Overdue";
        emailBody = `Dear ${payment.students?.parent_name || payment.students?.name},\n\nYour payment of GH₵${payment.amount} is now 7 days overdue. Please contact us immediately to discuss payment or any difficulties you may be experiencing.\n\nOutstanding Amount: GH₵${payment.amount}\nDue Date: 15th ${dueDate.toLocaleString("default", { month: "long", year: "numeric" })}\nDays Overdue: 7\n\nWe value your enrollment and want to work with you. Please reach out to us.\n\nContact: 0598614685\n\n49ice Music Academy`;
        smsMessage = `URGENT: Your GH₵${payment.amount} payment is 7 days overdue. Please contact us or pay immediately.`;
      }

      if (!reminderType) {
        console.log(`  ⚠️ No reminder criteria met - skipping`);
        console.log(`    - Checking: daysDiff=${daysDiff}`);
        console.log(`    - Available criteria: 3 (3 days before), 0 (due date), -3 (3 days after), -7 (7 days after)`);
        continue;
      }

      console.log(`  📧 Reminder Type: ${reminderType}`);

      // Send email
      const recipientEmail = payment.students?.parent_email || payment.students?.email;
      console.log(`  📧 Email recipient: ${recipientEmail || 'NONE'}`);
      if (recipientEmail) {
        try {
          await resend.emails.send({
            from: "49ice Music Academy <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: emailSubject,
            text: emailBody,
          });
          console.log(`  ✅ Email sent successfully to ${recipientEmail}`);
        } catch (emailError) {
          console.error(`  ❌ Email error:`, emailError);
        }
      } else {
        console.log(`  ⚠️ No email address available - skipping email`);
      }

      // Send SMS
      const recipientPhone = payment.students?.parent_phone || payment.students?.phone;
      const phoneSource = payment.students?.parent_phone ? 'parent_phone' : 'phone';
      console.log(`  📱 SMS recipient: ${recipientPhone || 'NONE'} (from ${phoneSource})`);
      
      if (!smsApiKey) {
        console.log(`  ⚠️ SMS API key not configured - skipping SMS`);
      } else if (!recipientPhone) {
        console.log(`  ⚠️ No phone number available - skipping SMS`);
      } else {
        try {
          // Build SMS URL with query parameters
          const smsUrl = new URL("https://api.smsonlinegh.com/v5/sms/send");
          smsUrl.searchParams.append("key", smsApiKey);
          smsUrl.searchParams.append("to", recipientPhone);
          smsUrl.searchParams.append("type", "0");
          smsUrl.searchParams.append("text", smsMessage);
          smsUrl.searchParams.append("sender", senderId);

          console.log(`  🔗 SMS API URL: ${smsUrl.toString().replace(smsApiKey, "***KEY***")}`);
          console.log(`  📝 SMS Message: ${smsMessage}`);

          const smsResponse = await fetch(smsUrl.toString());
          const responseText = await smsResponse.text();

          console.log(`  📡 SMS API Response Status: ${smsResponse.status}`);
          console.log(`  📡 SMS API Response Body: ${responseText}`);

          if (smsResponse.ok) {
            console.log(`  ✅ SMS sent successfully to ${recipientPhone}`);
          } else {
            console.error(`  ❌ SMS API error (${smsResponse.status}):`, responseText);
          }
        } catch (smsError) {
          console.error(`  ❌ SMS sending error:`, smsError);
        }
      }

      // Update reminder_sent field
      const updatedReminderSent = {
        ...reminderSent,
        [reminderType]: new Date().toISOString(),
      };

      console.log(`  💾 Updating reminder_sent field:`, updatedReminderSent);
      await supabase.from("payments").update({ reminder_sent: updatedReminderSent }).eq("id", payment.id);

      remindersSent++;
      console.log(`  ✅ Reminder processing complete\n`);
    }

    console.log(`Reminders sent: ${remindersSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        totalPayments: payments.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Error in send-payment-reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
