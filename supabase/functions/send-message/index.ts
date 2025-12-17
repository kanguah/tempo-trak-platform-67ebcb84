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

/**
 * Replaces template variables in a string with values from an object.
 * Template variables are wrapped in double curly braces: {{variableName}}
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
}

interface Recipient {
  id?: string;
  name: string;
  contact: string;
  type: string;
  recipientId?: string;
  amount?: string;
  date?: string;
  instrument?: string;
  subject?: string;
  tutor?: string;
  time?: string;
}

interface SendMessageRequest {
  messageId: string;
  channel: "email" | "sms";
  subject?: string;
  messageBody: string;
  recipients: Recipient[];
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

    const { messageId, channel, subject, messageBody, recipients }: SendMessageRequest = await req.json();

    console.log(`Sending ${channel} message to ${recipients.length} recipients`);

    // Update message status to sending
    await supabaseClient
      .from("messages")
      .update({ status: "sending", sent_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("user_id", user.id);

    let successCount = 0;
    let failCount = 0;

    // Initialize Resend for email
    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

    // Process each recipient
    for (const recipient of recipients) {
      try {
        let deliveryStatus = "sent";

        // Build variables object for template replacement
        const templateVars: Record<string, string> = {
          name: recipient.name || "",
          type: recipient.type || "",
          amount: recipient.amount || "",
          date: recipient.date || "",
          instrument: recipient.instrument || "",
          subject: recipient.subject || "",
          tutor: recipient.tutor || "",
          time: recipient.time || "",
        };

        console.log(`Processing recipient: ${recipient.name}, templateVars:`, templateVars);

        // Replace template variables in message body and subject
        const personalizedBody = replaceTemplateVariables(messageBody, templateVars);
        const personalizedSubject = subject ? replaceTemplateVariables(subject, templateVars) : undefined;

        console.log(`Personalized body for ${recipient.name}:`, personalizedBody);

        if (channel === "email") {
          // Send email using Resend
          if (!resend) {
            throw new Error("Resend API key not configured");
          }

          const emailHtml = personalizedBody.replace(/\n/g, "<br>");

          const emailResponse = await resend.emails.send({
            from: "49ice Music Academy <noreply@49iceacademy.org>",
            to: [recipient.contact],
            subject: personalizedSubject || "Message from 49ice Music Academy",
            html: emailHtml,
          });

          console.log(`Email sent to ${recipient.contact}:`, emailResponse);
        } else if (channel === "sms") {
          console.log(recipient);
          console.log(SMSONLINEGH_API_KEY);
          // Send SMS using SMS Online Ghana
          if (!SMSONLINEGH_API_KEY) {
            throw new Error("SMS API key not configured");
          }
          const smsUrl = new URL("https://api.smsonlinegh.com/v5/sms/send");
          smsUrl.searchParams.append("key", SMSONLINEGH_API_KEY);
          smsUrl.searchParams.append("to", recipient.contact);
          smsUrl.searchParams.append("type", "0");
          smsUrl.searchParams.append("text", personalizedBody);
          smsUrl.searchParams.append("sender", senderId);

          console.log(smsUrl);

          const smsResponse = await fetch(smsUrl.toString());

          const smsResult = await smsResponse.json();

          if (!smsResponse.ok || smsResult.status === "error") {
            throw new Error(smsResult.message || "SMS sending failed");
          }
          console.log(`SMS sent to ${recipient.contact}:`, smsResult);
        }

        successCount++;

        // Insert recipient record
        await supabaseClient.from("message_recipients").insert({
          message_id: messageId,
          recipient_type: recipient.type,
          recipient_id: recipient.recipientId,
          recipient_name: recipient.name,
          recipient_contact: recipient.contact,
          delivery_status: deliveryStatus,
          sent_at: new Date().toISOString(),
        });

        // Log success
        const { data: recipientData } = await supabaseClient
          .from("message_recipients")
          .select("id")
          .eq("message_id", messageId)
          .eq("recipient_contact", recipient.contact)
          .single();

        if (recipientData) {
          await supabaseClient.from("message_logs").insert({
            message_id: messageId,
            recipient_id: recipientData.id,
            event_type: "sent",
            event_data: { channel, timestamp: new Date().toISOString() },
          });
        }
      } catch (error: any) {
        console.error(`Failed to send to ${recipient.contact}:`, error);
        failCount++;

        // Insert failed recipient record
        await supabaseClient.from("message_recipients").insert({
          message_id: messageId,
          recipient_type: recipient.type,
          recipient_id: recipient.recipientId,
          recipient_name: recipient.name,
          recipient_contact: recipient.contact,
          delivery_status: "failed",
          delivery_error: error?.message || "Unknown error",
          sent_at: new Date().toISOString(),
        });

        // Log failure
        const { data: recipientData } = await supabaseClient
          .from("message_recipients")
          .select("id")
          .eq("message_id", messageId)
          .eq("recipient_contact", recipient.contact)
          .single();

        if (recipientData) {
          await supabaseClient.from("message_logs").insert({
            message_id: messageId,
            recipient_id: recipientData.id,
            event_type: "failed",
            event_data: { channel, error: error?.message || "Unknown error", timestamp: new Date().toISOString() },
          });
        }
      }
    }

    // Update message status to sent or failed
    const finalStatus = failCount === recipients.length ? "failed" : "sent";
    await supabaseClient.from("messages").update({ status: finalStatus }).eq("id", messageId).eq("user_id", user.id);

    console.log(`Message sending completed: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Message sent: ${successCount} successful, ${failCount} failed`,
        successCount,
        failCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Error in send-message function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
