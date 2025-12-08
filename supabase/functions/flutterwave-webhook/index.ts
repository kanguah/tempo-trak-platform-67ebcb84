import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (optional but recommended)
    const verifHash = req.headers.get('verif-hash');
    const secretHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_SECRET');
    
    // If webhook secret is configured, verify it
    if (secretHash && verifHash !== secretHash) {
      console.warn('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Only process successful payments
    if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
      console.log('Ignoring non-successful payment event');
      return new Response('OK', { headers: corsHeaders });
    }

    const { data } = payload;
    const meta = data.meta || {};
    const { organization_id, plan_id, user_id } = meta;

    if (!organization_id || !plan_id) {
      console.error('Missing organization_id or plan_id in webhook meta');
      return new Response('Missing metadata', { status: 400, headers: corsHeaders });
    }

    // Create admin client to update organization
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update organization subscription
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        subscription_plan: plan_id,
        flutterwave_customer_id: data.customer?.id?.toString(),
        flutterwave_subscription_id: data.id?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organization_id);

    if (updateError) {
      console.error('Failed to update organization:', updateError);
      throw updateError;
    }

    console.log(`Successfully activated ${plan_id} plan for organization ${organization_id}`);

    // Optionally create a notification for the user
    if (user_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id,
          organization_id,
          type: 'payment_reminder',
          title: 'Subscription Activated',
          message: `Your ${plan_id} subscription has been activated successfully.`,
        });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
