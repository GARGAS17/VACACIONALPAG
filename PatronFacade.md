# 🏛️ Patrón Facade (Ventanilla Única de Inscripciones)

## 📖 Referencia Teórica
[Refactoring Guru: Patrón Facade](https://refactoring.guru/es/design-patterns/facade)

> **Propósito Técnico:** Facade (Fachada) es un patrón de diseño estructural que proporciona una interfaz simplificada a una biblioteca, un framework, o cualquier grupo complejo de clases o subsistemas.

## 📌 Contexto en el Proyecto
El componente de React `Catalog.jsx` era responsable de toda la orquestación del negocio cada vez que un usuario daba click en "Inscribirse".
El componente tenía que:
1. Crear instancias de `PaymentRequest`.
2. Consultar al `PaymentFactory` por un adaptador (Stripe, Manual, etc).
3. Evaluar condicionales sobre las URLs de redirección.
4. Generar 3 notificaciones distintas mediante `NotificationFactory` dependiendo del estatus del pago.

**Code Smell:** Esto provocaba **Feature Envy** (la UI quería hacer el trabajo del backend) y generaba un **God Component** (un componente sobrecargado de lógica transaccional).

## 📂 Archivos Involucrados
| Responsabilidad | Archivo(s) | Ruta |
| --- | --- | --- |
| **La Fachada** | `EnrollmentFacade.ts` | `src/services/EnrollmentFacade.ts` |
| **Subsistemas** | `paymentAdapter.js`, `notificationBridge.ts` | `src/services/` |
| **Cliente / UI** | `Catalog.jsx` | `src/pages/Catalog.jsx` |

---

## 💻 El Código (Explicación Arquitectónica)

### 1. La Clase Facade (La "Ventanilla Única")
Oculta la interacción con múltiples dependencias, capturando sus errores y devolviendo un DTO (Data Transfer Object) predecible y plano a la UI.

```typescript
// src/services/EnrollmentFacade.ts
import { PaymentFactory, PaymentRequest } from './paymentAdapter';
import { NotificationFactory } from './notificationBridge';

export class EnrollmentFacade {
  static async processEnrollment(courseId, userId, paymentMethod) {
    try {
      // 1. Delegación al Subsistema de Pagos
      const request = new PaymentRequest(courseId, userId, paymentMethod);
      const adapter = PaymentFactory.createAdapter(paymentMethod);
      const result = await adapter.procesar(request);

      // 2. Delegación al Subsistema de Notificaciones (Bridge)
      const isExternal = result.status === 'REDIRECT' && result.redirectUrl?.startsWith('http');

      if (isExternal) {
        NotificationFactory.create('system', 'toast').notify(result.message, 'info');
      } else if (result.redirectUrl) {
        NotificationFactory.create('standard', 'toast').notify(result.message, 'success');
      } else {
        NotificationFactory.create('urgent', 'toast').notify(result.message, 'error');
        return { success: false, url: null, isExternal: false };
      }

      // 3. Empaquetado simplificado para la UI
      return { success: true, url: result.redirectUrl, isExternal };

    } catch (error) {
      // Manejo de error global aislado del Frontend
      NotificationFactory.create('urgent', 'toast').notify(`Error: ${error.message}`, 'error');
      return { success: false, url: null, isExternal: false };
    }
  }
}
```

### 2. El Cliente Simplificado
El componente React elimina la importación de factorías y adaptadores, reduciendo drásticamente su complejidad ciclomática.

```jsx
// src/pages/Catalog.jsx
const handleEnroll = async (courseId) => {
  setEnrolling(true);
  
  // Llamada a la fachada: El componente ignora por completo a Stripe o Zustand.
  const result = await EnrollmentFacade.processEnrollment(courseId, user?.id, paymentMethod);
  
  if (result.success && result.url) {
    if (result.isExternal) window.location.assign(result.url);
    else navigate(result.url);
  }
  
  setEnrolling(false);
};
```

## 🚀 Beneficios
1. **Separación de Preocupaciones (SoC):** La lógica de orquestación de la inscripción ahora está aislada y puede ser reutilizada en otros flujos de la aplicación (por ejemplo, mediante una API interna para administradores).
2. **Prevención del Acoplamiento:** Los componentes UI ya no dependen de las clases concretas de pagos o notificaciones; si la pasarela de pago cambia radicalmente, `Catalog.jsx` se mantendrá invicto.
