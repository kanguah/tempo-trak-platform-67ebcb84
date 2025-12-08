import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, verif-hash",
};

const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Flutterwave webhook secret hash (should be configured in Flutterwave dashboard)
const WEBHOOK_HASH = Deno.env.get("FLUTTERWAVE_WEBHOOK_HASH");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get("verif-hash");
    if (WEBHOOK_HASH && signature !== WEBHOOK_HASH) {
      console.error("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const payload = await req.json();

    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Handle different event types
    if (payload.event === "charge.completed" && payload.data.status === "successful") {
      const { organization_id, plan_id } = payload.data.meta || {};

      if (!organization_id || !plan_id) {
        console.error("Missing metadata in webhook");
        return new Response("Missing metadata", { status: 400 });
      }

      // Verify the payment with Flutterwave
      const verifyResponse = await fetch(
        `https://api.flutterwave.com/v3/transactions/${payload.data.id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.status !== "success" || verifyData.data.status !== "successful") {
        console.error("Payment verification failed:", verifyData);
        return new Response("Payment verification failed", { status: 400 });
      }

      // Update organization subscription
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          subscription_status: "active",
          subscription_plan: plan_id,
          flutterwave_customer_id: payload.data.customer?.id?.toString(),
          trial_ends_at: null, // Clear trial since they're now subscribed
          updated_at: new Date().toISOString(),
        })
        .eq("id", organization_id);

      if (updateError) {
        console.error("Error updating organization:", updateError);
        throw updateError;
      }

      console.log(`Successfully activated ${plan_id} plan for organization ${organization_id}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
