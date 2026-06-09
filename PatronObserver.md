# Patrón Observer (Notificaciones del Ciclo de Vida)

## 📌 Contexto
Cuando un administrador publicaba o archivaba un curso, no existía un flujo estandarizado para notificar a otras partes del sistema sobre este evento. La lógica de lanzar alertas (toasts) o escribir logs de auditoría estaba fuertemente acoplada dentro del propio botón de la interfaz.

## 🎯 ¿Qué se hizo exactamente?
Se implementó el **Patrón Observer** para desacoplar el emisor del evento de los receptores:
1. **Subject (CourseSubject):** Mantiene una lista de observadores interesados en cambios del curso y provee métodos para suscribirse (`subscribe`), desuscribirse (`unsubscribe`) y notificar (`notify`).
2. **Observer (CourseObserver):** Interfaz que expone el método `update(event, course)` que es llamado por el sujeto.
3. **Concrete Observers:**
    * **`ToastNotificationObserver`**: Muestra banners animados (Toasts) en la pantalla del administrador con el nivel de alerta adecuado.
    * **`AuditLogObserver`**: Loguea el evento en la consola con fines de depuración y registro administrativo.

---

## 📂 Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Dominio (NUEVO)** | `src/features/admin/domain/CourseObserver.js` |
| **Consumidor UI** | `src/features/admin/pages/AdminCourses.jsx` |

---

## 💻 El Código (Antes vs Después)

### ❌ ANTES (Acoplamiento de Lógica de Alertas)
El componente UI tenía que llamar a funciones específicas de notificación y registrar logs directamente en su cuerpo de código. Si queríamos enviar un correo o actualizar otra vista, el código UI se volvía denso y complejo.

```javascript
/* src/features/admin/pages/AdminCourses.jsx */
const toggleStatus = async (id, currentStatus) => {
  // Lógica de base de datos...
  addToast({ message: 'Curso publicado', type: 'success' });
  console.log(`Auditoría: Curso ${id} cambiado a published`);
  // Si queremos integrar envío de correos, añadiríamos código aquí...
}
```

### ✅ DESPUÉS (Desacoplado con Suscriptores)
El componente UI solo emite la notificación al `CourseSubject`. Los observadores reaccionan de forma autónoma.

#### 1. Estructura de Observers y Subjects
```javascript
/* src/features/admin/domain/CourseObserver.js */
export class CourseSubject {
  constructor() { this.observers = []; }

  subscribe(observer) { this.observers.push(observer); }
  unsubscribe(observer) { this.observers = this.observers.filter(o => o !== observer); }

  notify(event, course) {
    this.observers.forEach(observer => observer.update(event, course));
  }
}

// Observador de Toasts en el Frontend
export class ToastNotificationObserver {
  constructor(addToast) { this.addToast = addToast; }
  update(event, course) {
    if (event === 'published') {
      this.addToast({ message: `📢 ¡OBSERVER NOTIFY! El curso "${course.title}" ha sido publicado.`, type: 'success' });
    }
    // Maneja otras alertas...
  }
}
```

#### 2. Suscripción y Notificación en el Frontend
Registramos los suscriptores en el ciclo de montaje de React (`useEffect`) y disparamos notificaciones al actualizar estados:

```javascript
/* src/features/admin/pages/AdminCourses.jsx */
useEffect(() => {
  const toastObs = new ToastNotificationObserver(addToast);
  const auditObs = new AuditLogObserver();
  
  subjectRef.current.subscribe(toastObs);
  subjectRef.current.subscribe(auditObs);

  return () => {
    subjectRef.current.unsubscribe(toastObs);
    subjectRef.current.unsubscribe(auditObs);
  };
}, []);

// En cualquier acción que cambie el estado del curso:
const handleTransitionStatus = async (course, targetStatus) => {
  // ... Lógica del State Pattern y guardado en DB ...
  
  // Notifica a todos los subscriptores registrados de forma agnóstica
  subjectRef.current.notify(nextStatus, updatedCourse);
};
```

---

## 🚀 Beneficios Alcanzados
- **Principio de Responsabilidad Única (SRP):** El componente de cursos no sabe ni le importa cómo se procesa la auditoría o la visualización de la alerta. Solo emite el suceso.
- **Extensibilidad:** Agregar nuevos flujos de respuesta ante eventos (ej. enviar un correo al profesor del curso, enviar notificaciones push a estudiantes suscritos, etc.) se reduce a crear un nuevo observador y suscribirlo, sin modificar ni una sola línea de código en la vista `AdminCourses.jsx`.
