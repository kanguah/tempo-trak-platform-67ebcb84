import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SMSONLINEGH_API_KEY = Deno.env.get("SMSONLINEGH_API_KEY");
const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
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
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    });

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

    let successCount = 0;
    let failCount = 0;

    // Initialize Resend
    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

    for (const payment of payments) {
      const recipientEmail = payment.students?.parent_email || payment.students?.email;
      const recipientPhone = payment.students?.parent_phone || payment.students?.phone;
      const recipientName = payment.students?.parent_name || payment.students?.name;
      const studentName = payment.students?.name;

      const dueDate = payment.due_date ? new Date(payment.due_date).toLocaleDateString() : "N/A";

      // Generate Flutterwave payment link
      /*const paymentLink = await generateFlutterwavePaymentLink(
        payment.amount,
        recipientEmail || "",
        recipientName || studentName || "Customer",
        studentName || "Student",
        payment.id,
        payment.package_type || "Monthly Fee",
      );
*/
      const paymentLink = "https://tinyurl.com/4juvre5x";
      const paymentLinkSection = paymentLink
        ? `\n\nPAY ONLINE:\nClick here to pay securely online: ${paymentLink}\n`
        : "";

      // Email content
      const emailSubject = `Payment Invoice - 49ice Music Academy`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment Invoice</h2>
          <p>Dear ${recipientName},</p>
          <p>This is a payment invoice for 49ice Music Academy.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Details:</h3>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Package:</strong> ${payment.package_type || "N/A"}</p>
            <p><strong>Amount Due:</strong> GHS ${payment.amount}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>
          
          ${
            paymentLink
              ? `
          <div style="background: #4CAF50; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <a href="${paymentLink}" style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;">
              💳 Pay Online Now
            </a>
          </div>
          `
              : ""
          }
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Other Payment Methods:</h3>
            <p><strong>BANK TRANSFER:</strong><br>
            Bank Name: GTBANK<br>
            Account Name: K.N.ANGUAH ENTERPRISE<br>
            Account No: 452135138140<br>
            Branch: KASOA</p>
            
            <p><strong>MOBILE MONEY:</strong><br>
            Account Name: K.N.ANGUAH ENTERPRISE-KWEKU NYANKOM ANGUAH<br>
            Account Number: 0598614685</p>
            
            <p><strong>CASH PAYMENT:</strong><br>
            Visit our facility at 49ice Music Academy</p>
          </div>
          
          <p>Thank you for your continued support!</p>
          <p>Best regards,<br>49ice Music Academy</p>
        </div>
      `;

      // SMS content with payment link
      const smsPaymentLink = paymentLink ? ` Pay online: ${paymentLink}` : "";
      const smsMessage = `Dear ${studentName}, your invoice for ${new Date(dueDate).toLocaleString("en-US", { month: "long" })} has been generated. Amount: GHS ${payment.amount}. Kindly pay before ${dueDate}.${smsPaymentLink}`;

      try {
        // Send email using Resend
        if ((channel === "email" || channel === "both") && recipientEmail) {
          if (!resend) {
            throw new Error("Resend API key not configured");
          }

          const emailResponse = await resend.emails.send({
            from: "49ice Music Academy <noreply@49iceacademy.org>",
            to: [recipientEmail],
            subject: emailSubject,
            html: emailHtml,
          });

          console.log(`Email sent to ${recipientEmail} for payment ${payment.id}:`, emailResponse);
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
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-invoice function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
