// Supabase Edge Function for Stripe Webhook Signature Verification and Profile Status Upgrade
// Save this file in: supabase/functions/stripe-webhook/index.ts
// Deploy using: supabase functions deploy stripe-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import Stripe from "https://esm.sh/stripe@14.19.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight Requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    console.error('Webhook Error: Missing Stripe-Signature header.')
    return new Response('Missing Stripe Signature', { status: 400 })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Required environment variables are not configured in Supabase.')
    }

    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2023-10-16',
    })

    const body = await req.text()
    
    // Construct and verify the secure Stripe signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log(`Successfully verified Stripe Webhook event: ${event.id} [${event.type}]`)

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const userId = session.metadata?.userId || session.client_reference_id

      if (!userId) {
        console.error('Webhook Error: No userId or client_reference_id found in event metadata.')
        return new Response('Missing userId', { status: 400 })
      }

      console.log(`Upgrading profile for user ID: ${userId} to buyer status.`)

      // Initialize high-privilege Supabase client to bypass RLS policies for payment upgrades safely
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })

      // Update user profile status to "buyer" in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'buyer' })
        .eq('id', userId)
        .select()

      if (error) {
        console.error(`Database update failed: ${error.message}`)
        return new Response(`Database update failed: ${error.message}`, { status: 500 })
      }

      console.log(`Successfully upgraded user ${userId} to "buyer"! Database Record:`, data)
    }

    return new Response(JSON.stringify({ received: true, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
