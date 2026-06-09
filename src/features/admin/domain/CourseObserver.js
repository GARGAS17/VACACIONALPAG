// ====================================================================
// 🔔 PATRÓN OBSERVER - Notificaciones de Eventos de Cursos
// ====================================================================
// Define un mecanismo de suscripción para notificar a múltiples
// observadores cuando ocurre un cambio en el ciclo de vida de los cursos.
// ====================================================================

export class CourseObserver {
  update(event, course) {
    throw new Error('Debe implementarse el método update');
  }
}

export class CourseSubject {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(event, course) {
    this.observers.forEach(observer => {
      try {
        observer.update(event, course);
      } catch (err) {
        console.error('Error al notificar al observador:', err);
      }
    });
  }
}

// Observador 1: Emisor de alertas visuales (Toasts)
export class ToastNotificationObserver extends CourseObserver {
  constructor(addToast) {
    super();
    this.addToast = addToast;
  }

  update(event, course) {
    switch (event) {
      case 'published':
        this.addToast({
          message: `📢 ¡OBSERVER NOTIFY! El curso "${course.title}" ha sido PUBLICADO y ya está visible en el catálogo.`,
          type: 'success'
        });
        break;
      case 'archived':
        this.addToast({
          message: `📁 ¡OBSERVER NOTIFY! El curso "${course.title}" ha sido ARCHIVADO y retirado del catálogo activo.`,
          type: 'info'
        });
        break;
      case 'draft':
        this.addToast({
          message: `📝 ¡OBSERVER NOTIFY! El curso "${course.title}" ahora se encuentra en estado BORRADOR.`,
          type: 'warning'
        });
        break;
      default:
        break;
    }
  }
}

// Observador 2: Registrador de logs de auditoría (Consola/Consumo interno)
export class AuditLogObserver extends CourseObserver {
  update(event, course) {
    console.log(
      `%c[AUDITORÍA DE CURSOS - OBSERVER]%c Evento: "${event}" | Curso: "${course.title}" | ID: ${course.id} | Fecha: ${new Date().toLocaleString()}`,
      'color: #f43f5e; font-weight: bold;',
      'color: #ffffff;'
    );
  }
}
