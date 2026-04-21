import { supabase } from '../api/supabase';

// ====================================================================
// 🔌 PATRÓN FACTORY + ADAPTER (VERSIÓN JS OPTIMIZADA)
// ====================================================================
// En JavaScript no necesitamos clases abstractas ni interfaces estrictas.
// Esta versión fusiona Factory y Adapter de forma directa y limpia:
// 1. DTOs: Estructuras claras de entrada/salida.
// 2. Adapters: Clases que procesan y estandarizan.
// 3. Factory: Diccionario simple que devuelve el Adapter correcto.
// ====================================================================

// ──────────────────────────────────────────────────────────
// 1. MODELOS DE DATOS (Contratos Estandarizados)
// ──────────────────────────────────────────────────────────
export class PaymentRequest {
  constructor(courseId, userId, method) {
    this.courseId = courseId;
    this.userId = userId;
    this.method = method;
  }
}

export class PaymentResponse {
  constructor({ transactionId = null, status, redirectUrl = null, message }) {
    this.transactionId = transactionId;
    this.status = status;       // 'SUCCESS' | 'PENDING' | 'REDIRECT' | 'FAILED'
    this.redirectUrl = redirectUrl;
    this.message = message;
  }
}

// ──────────────────────────────────────────────────────────
// 2. ADAPTADORES CONCRETOS (Integran lógica y traducen respuesta)
// Todos implementan implícitamente el método procesar(request)
// ──────────────────────────────────────────────────────────
class StripeAdapter {
  async procesar(request) {
    // Lógica nativa de Stripe
    const { data, error } = await supabase.functions.invoke('enroll', {
      body: { courseId: request.courseId, userId: request.userId }
    });

    if (error) throw error;

    // Adaptación a PaymentResponse
    return new PaymentResponse({
      transactionId: data?.sessionId,
      status: data?.url ? 'REDIRECT' : 'FAILED',
      redirectUrl: data?.url,
      message: data?.url ? 'Redirigiendo a pasarela segura...' : 'Error creando sesión.'
    });
  }
}

class ManualAdapter {
  async procesar(request) {
    // 1. Validar duplicados en base de datos
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', request.courseId)
      .eq('user_id', request.userId)
      .maybeSingle();

    if (existing) {
      return new PaymentResponse({
        transactionId: existing.id,
        status: 'FAILED',
        redirectUrl: '/dashboard/pagos',
        message: 'Ya tienes una solicitud de inscripción registrada para este curso.'
      });
    }

    // 2. Crear registro pendiente
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        course_id: request.courseId,
        user_id: request.userId,
        payment_status: 'pending',
        completion_status: 'enrolled',
        paid_amount: 0
      }).select('id').single();

    if (error) throw error;

    // Adaptación a PaymentResponse
    return new PaymentResponse({
      transactionId: data.id,
      status: 'PENDING',
      redirectUrl: '/dashboard/pagos',
      message: '¡Solicitud registrada! Envía el comprobante para habilitar tus clases.'
    });
  }
}

class PayPalAdapter {
  async procesar(request) {
    return new PaymentResponse({
      status: 'REDIRECT',
      redirectUrl: '/success_mock',
      message: 'Redirigiendo a PayPal (simulado)...'
    });
  }
}

// ──────────────────────────────────────────────────────────
// 3. FACTORY (Simplificada con un Diccionario)
// ──────────────────────────────────────────────────────────
export class PaymentFactory {
  static createAdapter(method) {
    const adapters = {
      stripe: new StripeAdapter(),
      manual: new ManualAdapter(),
      paypal: new PayPalAdapter()
    };

    const adapter = adapters[method.toLowerCase()];
    if (!adapter) throw new Error(`Método de pago "${method}" no soportado.`);
    
    return adapter;
  }
}
