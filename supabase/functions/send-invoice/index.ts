import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SMSONLINEGH_API_KEY = Deno.env.get("SMSONLINEGH_API_KEY");
const senderId = "49ice Music";

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

interface SendInvoiceRequest {
  paymentIds: string[];
  channel: "email" | "sms" | "both";
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

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("User not authenticated");
    }

    const { paymentIds, channel }: SendInvoiceRequest = await req.json();

    console.log(`Sending invoices for ${paymentIds.length} payments via ${channel}`);

    // Fetch payment details
    const { data: payments, error: paymentsError } = await supabaseClient
      .from("payments")
      .select("*, students(*)")
      .in("id", paymentIds)
      .eq("user_id", user.id);

    if (paymentsError) {
      throw paymentsError;
    }

    const resend = new Resend(RESEND_API_KEY);
    let successCount = 0;
    let failCount = 0;

    for (const payment of payments) {
      const recipientEmail = payment.students?.parent_email || payment.students?.email;
      const recipientPhone = payment.students?.parent_phone || payment.students?.phone;
      const recipientName = payment.students?.parent_name || payment.students?.name;
      const studentName = payment.students?.name;

      const dueDate = payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "N/A";
      
      // Email content
      const emailSubject = `Payment Invoice - 49ice Music Academy`;
      const emailBody = `Dear ${recipientName},

This is a payment invoice for 49ice Music Academy.

Payment Details:
- Student: ${studentName}
- Package: ${payment.package_type || "N/A"}
- Amount Due: GHS${payment.amount}
- Due Date: ${dueDate}
- Status: ${payment.status}

${PAYMENT_INSTRUCTIONS}

Thank you for your continued support!

Best regards,
49ice Music Academy`;

      // SMS content
      const smsMessage = `Invoice: GHS${payment.amount} due ${dueDate} for ${studentName}. Package: ${payment.package_type}. Pay via bank/mobile money. Thank you!`;

      try {
        // Send email
        if ((channel === "email" || channel === "both") && recipientEmail) {
          await resend.emails.send({
            from: "49ice Music Academy <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: emailSubject,
            text: emailBody,
          });
          console.log(`Email sent to ${recipientEmail} for payment ${payment.id}`);
        }

        // Send SMS
        if ((channel === "sms" || channel === "both") && recipientPhone && SMSONLINEGH_API_KEY) {
          const smsUrl = new URL("https://api.smsonlinegh.com/v5/sms/send");
          smsUrl.searchParams.append("key", SMSONLINEGH_API_KEY);
          smsUrl.searchParams.append("to", recipientPhone);
          smsUrl.searchParams.append("type", "0");
          smsUrl.searchParams.append("text", smsMessage);
          smsUrl.searchParams.append("sender", senderId);

          const smsResponse = await fetch(smsUrl.toString());

          if (smsResponse.ok) {
            console.log(`SMS sent to ${recipientPhone} for payment ${payment.id}`);
          } else {
            console.error("SMS API error:", await smsResponse.text());
          }
        }

        successCount++;
      } catch (error) {
        console.error(`Failed to send invoice for payment ${payment.id}:`, error);
        failCount++;
      }
    }

    console.log(`Invoices sent: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoices sent: ${successCount} successful, ${failCount} failed`,
        successCount,
        failCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
