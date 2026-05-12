# 🕵️ Patrón Proxy (Seguridad, Rendimiento y Auditoría)

## 📖 Referencia Teórica
[Refactoring Guru: Patrón Proxy](https://refactoring.guru/es/design-patterns/proxy)

> **Propósito Técnico:** Proxy es un patrón de diseño estructural que permite proporcionar un sustituto o marcador de posición para otro objeto. Un proxy controla el acceso al objeto original, permitiendo realizar tareas antes o después de que la solicitud llegue al objeto real (como inicialización perezosa, auditoría, o validación de seguridad).

## 📌 Contexto en el Proyecto
Implementamos una arquitectura robusta de 3 tipos de Proxies para atacar deficiencias distintas en la aplicación sin tocar los servicios puros (Open/Closed Principle).
1. **Protection Proxy:** Para blindar rutas o servicios exclusivos de administradores previniendo inyección por consola.
2. **Caching Proxy:** Para mitigar llamadas redundantes a base de datos en los paneles de métricas.
3. **Logging/Audit Proxy:** Para dejar rastros en operaciones sensibles (Inscripciones y transacciones).

## 📂 Archivos Involucrados
| Responsabilidad | Archivo(s) | Ruta |
| --- | --- | --- |
| **Central de Proxies** | `proxies.ts` | `src/services/proxies.ts` |
| **Clientes UI** | `AdminDashboard.jsx`, `Catalog.jsx` | `src/pages/...` |

---

## 💻 El Código (Explicación Arquitectónica)

### 1. Caching Proxy (Reducción de Latencia y RAM)
Envuelve el servicio que lee datos pesados. Si los datos están vigentes en memoria, ahorra el viaje a la red.

```typescript
// src/services/proxies.ts
export class MetricsCacheProxy implements IMetricsService {
  private realService = new RealMetricsService();
  private cache: any = null;
  private cacheTimestamp = 0;

  async getDashboardMetrics() {
    const now = Date.now();
    // Cache Hit (1 minuto de validez)
    if (this.cache && (now - this.cacheTimestamp < 60000)) {
      return this.cache;
    }
    
    // Cache Miss: Delega al sujeto real
    this.cache = await this.realService.getDashboardMetrics();
    this.cacheTimestamp = now;
    return this.cache;
  }
}
```

### 2. Protection Proxy (Intercepción de Seguridad Frontend)
Controla el acceso al objeto real verificando permisos antes de siquiera tocar la base de datos (ideal para proteger funciones críticas como borrado de datos).

```typescript
export class CourseProtectionProxy implements ICourseService {
  private realService = new RealCourseService();

  async deleteCourse(courseId: string) {
    const state = useAuthStore.getState() as { profile?: { role?: string } | null };
    
    if (state.profile?.role !== 'admin') {
      throw new Error('ACCESO DENEGADO: Solo un administrador puede borrar cursos.');
    }

    return this.realService.deleteCourse(courseId);
  }
}
```

### 3. Audit Proxy (Bitácora Silenciosa Transaccional)
Se envuelve (o hereda de) la fachada original. Registra métricas o datos sin estorbar al flujo del usuario.

```typescript
export class AuditEnrollmentProxy {
  static async processEnrollment(courseId: string, userId: string, method: string) {
    const startTime = Date.now();

    // Invocación a la Fachada original
    const result = await EnrollmentFacade.processEnrollment(courseId, userId, method);

    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`[PROXY AUDIT] ÉXITO: Transacción en ${duration}ms. Usuario ${userId}`);
    }

    return result;
  }
}
```

## 🚀 Beneficios
1. **Desacoplamiento Estricto:** Podemos agregar validaciones de red, memorias caché o logs para *Analytics* sin manchar con condicionales `if` el código transaccional principal.
2. **Escalabilidad y Observabilidad:** Permite medir métricas como el tiempo de latencia (latency tracking) y volcar los *logs* en un sistema como Datadog de manera transparente.
