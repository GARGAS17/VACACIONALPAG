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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
       return new Response(JSON.stringify({ error: 'Falta token de autorización' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       })
    }

    // 1. Crear cliente con el token del usuario para validar identidad
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
       return new Response(JSON.stringify({ error: 'No autorizado o token expirado' }), { 
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       })
    }

    // 2. Cliente Service Role para búsquedas totales
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Buscar stripe_customer_id en pagos anteriores para el id validado (user.id)
    const { data: paymentInfo, error: queryError } = await supabaseClient
      .from('payments')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const customerId = paymentInfo?.stripe_customer_id;

    if (queryError || !customerId || customerId === 'unknown' || !customerId.startsWith('cus_')) {
       return new Response(JSON.stringify({ error: 'Aún no posees una cuenta de Cliente en Stripe válida. Realiza tu primer pago REAL para habilitarlo.' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       })
    }

    // 4. Crear sesión del Portal de Facturación de Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/`,
    });

    return new Response(JSON.stringify({ url: session.url }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
