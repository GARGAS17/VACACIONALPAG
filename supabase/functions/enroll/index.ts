import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { courseId, userId } = await req.json()

    // 1. Validar curso y cupos
    const { data: course, error: queryError } = await supabaseClient
      .from('courses')
      .select('title, price, capacity, enrolled_count')
      .eq('id', courseId)
      .single()

    if (queryError) {
      console.error(queryError)
    }

    if (!course || course.enrolled_count >= course.capacity) {
      return new Response(JSON.stringify({ error: 'No hay cupos' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Crear Checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: course.title },
          unit_amount: course.price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${Deno.env.get('FRONTEND_URL')}/success`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/courses`,
      metadata: { courseId, userId } // Datos clave para el webhook
    })

    return new Response(JSON.stringify({ url: session.url }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})