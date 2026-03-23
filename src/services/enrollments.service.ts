import { supabase } from '../api/supabase';
import { Enrollment, Course } from '../api/types';

export class EnrollmentsService {
  /**
   * Obtiene las inscripciones del usuario autenticado actual.
   */
  static async getMyEnrollments(): Promise<(Enrollment & { course?: Course })[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando inscripciones:', error);
      throw error;
    }
    
    return data as (Enrollment & { course: Course })[];
  }

  /**
   * Inscribe al usuario actual en un curso específico.
   * El cálculo de cupos se procesa de forma segura a través de triggers en Supabase (schema_v2_OPTIMIZADO).
   */
  static async enrollInCourse(courseId: string, paymentType: string = 'stripe'): Promise<Enrollment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Para inscribirse debe iniciar sesión');

    // 1. Verificar precio del curso para total_paid (Se puede expandir con Stripe)
    const { data: course, error: fetchErr } = await supabase
      .from('courses')
      .select('price')
      .eq('id', courseId)
      .single();

    if (fetchErr) throw new Error('No se pudo encontrar el curso seleccionado');

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: 'pending',
        total_paid: course?.price || 0,
        payment_type: paymentType
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('No hay cupos')) {
        throw new Error('Lo sentimos, este curso ya no tiene cupos disponibles');
      }
      throw error;
    }

    return data as Enrollment;
  }

  /**
   * Cancela una inscripción existente (devolviendo el cupo automáticamente).
   */
  static async cancelEnrollment(enrollmentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('id', enrollmentId);

    if (error) {
      console.error('Error cancelando inscripción:', error);
      throw error;
    }
    
    return true;
  }
}
