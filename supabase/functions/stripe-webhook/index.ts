import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body, 
      signature!, 
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type === 'checkout.session.completed') {
      const sessionObj = event.data.object
      
      // 1. Expandimos el payment_intent para obtener el método de pago de forma detallada
      const session = await stripe.checkout.sessions.retrieve(sessionObj.id, {
        expand: ['payment_intent.payment_method'],
      }) as any;

      const { courseId, userId } = session.metadata
      const paymentMethod = session.payment_intent?.payment_method;

      // 1. Buscar si ya existe la inscripción
      let { data: enrollment, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle()

      if (fetchError) throw fetchError

      // 2. Crear o actualizar la inscripción
      if (enrollment) {
        const { data: updated, error: updateError } = await supabase
          .from('enrollments')
          .update({
            payment_status: 'completed',
            payment_id: session.id,
            paid_amount: session.amount_total / 100,
            payment_at: new Date().toISOString() // ← Añadido
          })
          .eq('id', enrollment.id)
          .select().single()
        if (updateError) throw updateError
        enrollment = updated
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            payment_status: 'completed',
            payment_id: session.id,
            paid_amount: session.amount_total / 100,
            payment_at: new Date().toISOString() // ← Añadido
          })
          .select().single()
        if (insertError) throw insertError
        enrollment = inserted
      }

      // 3. Crear el registro en 'payments' basándonos en tu esquema REAL
      if (enrollment) {
        const { error: paymentError } = await supabase.from('payments').insert({
          enrollment_id: enrollment.id,
          user_id: userId,
          stripe_payment_id: session.id,
          stripe_customer_id: session.customer || 'unknown',
          amount: session.amount_total / 100,
          currency: (session.currency || 'usd').toUpperCase(),
          status: 'completed',
          payment_method: paymentMethod?.type || 'card', // ← Dinámico
          last_4_digits: paymentMethod?.card?.last4 || null // ← Dinámico
        })
        
        if (paymentError) throw paymentError
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error(`Webhook Error [Debug]: ${err.message}`, err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})