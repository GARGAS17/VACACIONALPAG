# Patron Abstract Factory + Adapter (Pagos)

## 📌 Contexto
En el flujo de pagos de la plataforma (Stripe vs Manual), el componente principal **`Catalog.jsx`** tenía que lidiar con respuestas completamente diferentes dependiendo del tipo de pago. Además, manejaba lógicas específicas de cada proveedor. 

## 🎯 ¿Qué se hizo exactamente?
Se combinaron dos patrones para abstraer y normalizar los pagos:
1. **Factory Method:** Para decidir en tiempo real qué procesador de pago instanciar.
2. **Adapter (Adaptador):** Para tomar la respuesta cruda de cualquier proveedor de pagos y "traducirla" a un contrato o interfaz estándar para que el frontend reaccione siempre de la misma forma.

---

## 📂 Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Servicio (NUEVO)** | `src/services/paymentAdapter.js` |
| **Consumidor UI** | `src/pages/Catalog.jsx` |

---

## 💻 El Código (Antes vs Después)

### ❌ ANTES (Alto Acoplamiento)
El Front-End debía saber qué respuesta generaba cada servicio externo. Esto rompe el principio Open/Closed porque si mañana entraba *PayPal*, la función `handleEnroll` crecería infinitamente con `if/else`.

```javascript
/* src/pages/Catalog.jsx */
const handleEnroll = async (courseId) => {
  const processor = PaymentFactory.getProcessor(paymentMethod);
  
  // Stripe devolvía una url directamente, el Checkout Manual no retornaba nada estándar
  const { url } = await processor.checkout({ courseId, userId: user?.id });
  
  if (url) {
    // Código espagueti para saber si era redirección externa o interna
    if (url.startsWith('http')) window.location.assign(url);
    else navigate(url);
  }
}
```

### ✅ DESPUÉS (Arquitectura Limpia con Patrones)
Creamos una clase central que funge como adaptador (`paymentAdapter.js`). Todos los procesadores devuelven ahora un objeto tipado `PaymentResponse` estándar.

#### 1. El Adaptador Unificado
```javascript
/* src/services/paymentAdapter.js */
export class PaymentRequest {
  constructor(courseId, userId, method) { ... }
}

export class PaymentResponse {
  constructor({ transactionId, status, redirectUrl, message }) { ... }
}

// Adaptadores Específicos que normalizan las APIs
class StripeAdapter {
  async procesar(request) {
    // Llama a stripe y empaqueta el Response en nuestro estándar
    return new PaymentResponse({ status: 'REDIRECT', redirectUrl: data.url ... });
  }
}
```

#### 2. El Frontend (Consumidor)
```javascript
/* src/pages/Catalog.jsx (AHORA) */
const handleEnroll = async (courseId) => {
    // 1. Estructuramos petición estándar
    const request = new PaymentRequest(courseId, user?.id, paymentMethod);

    // 2. Factory nos da la instancia del adaptador concreto
    const adapter = PaymentFactory.createAdapter(paymentMethod);

    // 3. Procesamos de forma agnóstica al proveedor
    const result = await adapter.procesar(request);

    // 4. Consumo unificado, simple y limpio
    if (result.status === 'REDIRECT') {
        goTo(result.redirectUrl);
    }
}
```

## 🚀 Beneficios Alcanzados
- **Desacoplamiento Front/Back:** El UI no sabe si estamos usando Stripe, PayPal o Cupones. Solo confía en el campo `result.status`.
- **Mantenibilidad:** Agregar un nuevo procesador de pagos solo requiere crear la clase `PayPalAdapter` e inyectarla en la Factory. `Catalog.jsx` nunca más se tocará.
