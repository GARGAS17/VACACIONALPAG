import { supabase } from '../api/supabase';

// Clase base abstracta o interfaz conceptual
class PaymentProcessor {
  checkout({ courseId, userId }) {
    throw new Error("checkout() debe implementarse");
  }
}

// Procesador de Stripe
class StripeProcessor extends PaymentProcessor {
  async checkout({ courseId, userId }) {
    const { data, error } = await supabase.functions.invoke('enroll', {
      body: { courseId, userId }
    });
    if (error) throw error;
    return { url: data?.url };
  }
}

// Procesador simulado (para futuras expansiones como PayPal)
class PayPalProcessor extends PaymentProcessor {
  async checkout({ courseId }) {
    alert('Iniciando pago simulado por PayPal...');
    return { url: '/success_mock' };
  }
}

// Procesador Manual o Transferencia
class ManualProcessor extends PaymentProcessor {
  async checkout({ courseId, userId }) {
    // 1. Prevenir errores de Duplicado (Ya estás inscrito)
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      alert('Ya tienes una solicitud de inscripción o pago registrado para este curso.');
      return { url: '/dashboard/pagos' };
    }

    // 2. Crear la inscripción con estado pendiente
    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        user_id: userId,
        payment_status: 'pending', // Queda flotando para que Admin lo verifique
        completion_status: 'enrolled',
        paid_amount: 0
      });

    if (error) throw error;
    alert('¡Solicitud registrada! Envía el comprobante para habilitar tus clases.');
    return { url: '/dashboard/pagos' };
  }
}

// 🏭 FACTORY
export class PaymentFactory {
  static getProcessor(methodName = 'stripe') {
    switch (methodName.toLowerCase()) {
      case 'stripe':
        return new StripeProcessor();
      case 'paypal':
        return new PayPalProcessor();
      case 'manual':
        return new ManualProcessor();
      default:
        throw new Error(`Método de pago '${methodName}' no soportado.`);
    }
  }
}
