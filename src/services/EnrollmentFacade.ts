import { PaymentFactory, PaymentRequest } from './paymentAdapter';
import { NotificationFactory } from './notificationBridge';

// ====================================================================
// 🏛️ PATRÓN FACADE - Sistema de Inscripción
// ====================================================================
// El Facade actúa como una "ventanilla única". Oculta toda la lógica
// compleja de construir peticiones de pago, interactuar con adaptadores,
// procesar la respuesta y orquestar las notificaciones del Bridge.
// ====================================================================

export class EnrollmentFacade {
  /**
   * Procesa la inscripción de un usuario en un curso.
   * Orquesta internamente la fábrica de pagos y el puente de notificaciones.
   */
  static async processEnrollment(
    courseId: string,
    userId: string | undefined,
    paymentMethod: string
  ): Promise<{ success: boolean; url: string | null; isExternal: boolean }> {
    try {
      if (!userId) {
        throw new Error('Usuario no autenticado.');
      }

      // 1. Interacción con el subsistema de Pagos (PaymentRequest + Factory + Adapter)
      const request = new PaymentRequest(courseId, userId, paymentMethod);
      // @ts-ignore - JS implementation
      const adapter = PaymentFactory.createAdapter(paymentMethod);
      const result = await adapter.procesar(request);

      // 2. Interacción con el subsistema de Notificaciones (Bridge)
      const isExternal = result.status === 'REDIRECT' && Boolean(result.redirectUrl?.startsWith('http'));

      if (isExternal) {
        // Redirección a Stripe (fuera de la app)
        const sysNotif = NotificationFactory.create('system', 'toast');
        sysNotif.notify(result.message, 'info');
      } else if (result.redirectUrl) {
        // Redirección interna (ej. éxito local)
        const stdNotif = NotificationFactory.create('standard', 'toast');
        stdNotif.notify(result.message, 'success');
      } else {
        // Error procesando
        const urgentNotif = NotificationFactory.create('urgent', 'toast');
        urgentNotif.notify(result.message, 'error');
        return { success: false, url: null, isExternal: false };
      }

      // 3. Devolvemos un contrato limpio a la UI
      return { 
        success: true, 
        url: result.redirectUrl || null, 
        isExternal 
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Notificación de error inesperado
      const errorNotif = NotificationFactory.create('urgent', 'toast');
      errorNotif.notify(`Error al iniciar inscripción: ${errorMessage}`, 'error');
      
      return { success: false, url: null, isExternal: false };
    }
  }
}
