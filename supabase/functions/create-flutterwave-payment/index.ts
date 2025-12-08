import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { organization_id, plan_id, plan_name, amount, currency, redirect_url } = await req.json();

    if (!organization_id || !plan_id || !amount) {
      throw new Error('Missing required fields');
    }

    // Verify user is owner of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('is_owner')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership?.is_owner) {
      throw new Error('Only organization owners can manage billing');
    }

    // Get user's email for the payment
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    if (!flutterwaveSecretKey) {
      throw new Error('Payment service not configured');
    }

    // Create Flutterwave payment link
    const tx_ref = `org-${organization_id}-${Date.now()}`;
    
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: currency || 'GHS',
        redirect_url: redirect_url || `${req.headers.get('origin')}/billing`,
        customer: {
          email: profile?.email || user.email,
          name: profile?.full_name || 'Customer',
        },
        customizations: {
          title: `${plan_name} Subscription`,
          description: `Subscribe to ${plan_name} plan`,
        },
        meta: {
          organization_id,
          plan_id,
          user_id: user.id,
        },
      }),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      console.error('Flutterwave error:', data);
      throw new Error(data.message || 'Failed to create payment');
    }

    console.log(`Payment link created for org ${organization_id}, plan: ${plan_id}`);

    return new Response(
      JSON.stringify({ link: data.data.link, tx_ref }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
