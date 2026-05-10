import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { EnrollmentFacade } from './EnrollmentFacade';

// ====================================================================
// 🕵️ PATRÓN PROXY - "El Intermediario"
// ====================================================================
// Controla el acceso al objeto real para añadir comportamientos
// (caché, seguridad, auditoría) SIN modificar el código original.
// ====================================================================

// ──────────────────────────────────────────────────────────
// 1. CACHING PROXY (Rendimiento para el Dashboard)
// ──────────────────────────────────────────────────────────
export interface IMetricsService {
  getDashboardMetrics(): Promise<any>;
}

// El Sujeto Real (El que hace el trabajo pesado)
export class RealMetricsService implements IMetricsService {
  async getDashboardMetrics() {
    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase.from('courses').select('id, title, enrolled_count, capacity, price, status'),
      supabase.from('enrollments').select('id, payment_status, courses(price)'),
    ]);

    if (coursesRes.error) throw coursesRes.error;
    if (enrollmentsRes.error) throw enrollmentsRes.error;

    const courses = coursesRes.data || [];
    const enrollments = enrollmentsRes.data || [];

    const paidEnrollments = enrollments.filter((e: any) => e.payment_status === 'completed');
    const totalRevenue = paidEnrollments.reduce((sum: number, e: any) => {
      const c = e.courses;
      const price = Array.isArray(c) ? (c[0]?.price ?? 0) : (c?.price ?? 0);
      return sum + price;
    }, 0);

    const topCourse = courses.reduce(
      (best: any, c: any) => (!best || c.enrolled_count > best.enrolled_count ? c : best),
      null
    );

    const totalCapacity = courses.reduce((s: number, c: any) => s + c.capacity, 0);
    const totalEnrolled = courses.reduce((s: number, c: any) => s + c.enrolled_count, 0);
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

    return {
      totalRevenue,
      topCourse: topCourse ? { title: topCourse.title, enrolled_count: topCourse.enrolled_count } : null,
      occupancyPercent,
      totalEnrollments: enrollments.length,
      totalCourses: courses.length,
      publishedCourses: courses.filter((c: any) => c.status === 'published').length,
    };
  }
}

// El Proxy (El guardaespaldas que cachea)
export class MetricsCacheProxy implements IMetricsService {
  private realService: RealMetricsService;
  private cache: any = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 60 * 1000; // 1 minuto de caché para ahorrar reads

  constructor() {
    this.realService = new RealMetricsService();
  }

  async getDashboardMetrics() {
    const now = Date.now();
    // ¿Aún es válida la caché?
    if (this.cache && (now - this.cacheTimestamp < this.CACHE_DURATION_MS)) {
      console.log('⚡ [PROXY] Ahorrando red: Devolviendo métricas desde la CACHÉ');
      return this.cache;
    }
    
    console.log('🐌 [PROXY] Caché vacía o expirada. Consultando a Supabase...');
    this.cache = await this.realService.getDashboardMetrics();
    this.cacheTimestamp = now;
    return this.cache;
  }
}

// ──────────────────────────────────────────────────────────
// 2. PROTECTION PROXY (Seguridad y Roles)
// ──────────────────────────────────────────────────────────
export interface ICourseService {
  deleteCourse(courseId: string): Promise<boolean>;
}

export class RealCourseService implements ICourseService {
  async deleteCourse(courseId: string) {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;
    return true;
  }
}

// El Proxy (El portero del club)
export class CourseProtectionProxy implements ICourseService {
  private realService: RealCourseService;

  constructor() {
    this.realService = new RealCourseService();
  }

  async deleteCourse(courseId: string) {
    // 🛡️ El proxy intercepta ANTES de tocar la red
    // Hacemos un cast seguro ya que useAuthStore aún no tiene una interfaz TypeScript estricta exportada
    const state = useAuthStore.getState() as { profile?: { role?: string } | null };
    const profile = state.profile;
    
    if (profile?.role !== 'admin') {
      console.error('⛔ [PROXY] Ataque bloqueado: Permisos insuficientes.');
      throw new Error('ACCESO DENEGADO: Solo un administrador puede borrar cursos.');
    }

    console.log(`✅ [PROXY] Rol verificado (${profile.role}). Procediendo a borrar curso...`);
    return this.realService.deleteCourse(courseId);
  }
}

// ──────────────────────────────────────────────────────────
// 3. LOGGING / AUDIT PROXY (Auditoría Silenciosa)
// ──────────────────────────────────────────────────────────
// Envuelve la Fachada estática que creamos anteriormente
export class AuditEnrollmentProxy {
  static async processEnrollment(courseId: string, userId: string | undefined, method: string) {
    console.log(`📋 [PROXY AUDIT] INICIO: Usuario ${userId} intentando pagar curso ${courseId} vía ${method}`);
    const startTime = Date.now();

    // 🌉 Llamada delegada al objeto real (nuestra Fachada)
    const result = await EnrollmentFacade.processEnrollment(courseId, userId, method);

    const duration = Date.now() - startTime;
    
    // 📋 El Proxy intercepta la respuesta y registra sin estorbar a la UI
    if (result.success) {
      console.log(`✅ [PROXY AUDIT] ÉXITO: Transacción procesada en ${duration}ms. Redirigiendo...`);
      // Opcional: supabase.from('audit_logs').insert(...)
    } else {
      console.warn(`⚠️ [PROXY AUDIT] FALLO: Transacción rechazada en ${duration}ms.`);
    }

    return result;
  }
}

// ──────────────────────────────────────────────────────────
// INSTANCIAS EXPORTADAS (Para usar fácilmente en React)
// ──────────────────────────────────────────────────────────
export const metricsService = new MetricsCacheProxy();
export const adminCourseService = new CourseProtectionProxy();
