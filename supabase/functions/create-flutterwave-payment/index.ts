import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const planPrices: Record<string, { amount: number; currency: string; name: string }> = {
  starter: { amount: 29, currency: "USD", name: "Starter Plan" },
  professional: { amount: 79, currency: "USD", name: "Professional Plan" },
  enterprise: { amount: 199, currency: "USD", name: "Enterprise Plan" },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get the user from the token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { organization_id, plan_id } = await req.json();

    if (!organization_id || !plan_id) {
      throw new Error("Missing organization_id or plan_id");
    }

    // Verify user is org owner
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership?.is_owner) {
      throw new Error("Only organization owners can manage billing");
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      throw new Error("Organization not found");
    }

    const plan = planPrices[plan_id];
    if (!plan) {
      throw new Error("Invalid plan");
    }

    // Create Flutterwave payment link
    const flutterwaveResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: `sub_${organization_id}_${Date.now()}`,
        amount: plan.amount,
        currency: plan.currency,
        redirect_url: `${req.headers.get("origin")}/billing?status=success`,
        payment_options: "card, mobilemoney, bank transfer",
        meta: {
          organization_id,
          plan_id,
          user_id: user.id,
        },
        customer: {
          email: user.email,
          name: org.name,
        },
        customizations: {
          title: "Academy Subscription",
          description: `${plan.name} - Monthly Subscription`,
          logo: org.logo_url || undefined,
        },
      }),
    });

    const flutterwaveData = await flutterwaveResponse.json();

    console.log("Flutterwave response:", flutterwaveData);

    if (flutterwaveData.status !== "success") {
      throw new Error(flutterwaveData.message || "Failed to create payment");
    }

    return new Response(
      JSON.stringify({
        payment_link: flutterwaveData.data.link,
        tx_ref: flutterwaveData.data.tx_ref,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
