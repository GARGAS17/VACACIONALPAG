# Patrón Bridge + Factory (Sistema de Notificaciones)

## 📌 Contexto
En la aplicación, las notificaciones se disparaban llamando directamente al store global de **Zustand** (`useNotificationStore`). A medida que la app crece, puede requerirse notificar bajo distintos canales (UI Toasts, Ventanas de Alerta nativas, o Correos Electrónicos), además de darles distintos "Tonos/Tipos" (sistemas, urgente, estándar).

## 🎯 ¿Qué se hizo exactamente?
Implementamos The **Bridge Pattern (Patrón Puente)** ensamblado mediante un **Factory Method**.
El patrón separa la jerarquía en dos dimensiones que pueden crecer independientemente:
- **Abstracción:** El "Qué" se envía (Lógica del contenido: Estándar, Urgente, Sistema).
- **Implementación:** El "Cómo" se envía (El canal de envío: UI Toast, Alert Nativo, Email Backend).

---

## 📂 Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Puente y Factory (NUEVO)** | `src/services/notificationBridge.ts` |
| **Store (Capa de Hardware UI)** | `src/services/useNotificationStore.ts` |
| **Consumidor UI** | `src/pages/Catalog.jsx` |

---

## 💻 El Código (Antes vs Después)

### ❌ ANTES (Altamente Acoplamiento a Zustand)
El componente invocaba directamente el _hook_ reactivo. Si el día de mañana deseábamos enviar correos ante un evento fallido, teníamos que tocar docenas de componentes en el Front-End.

```javascript
/* src/pages/Catalog.jsx */
import { useNotificationStore } from '../services/useNotificationStore';

export default function Catalog() {
  const { addToast } = useNotificationStore();

  const handleEnroll = () => {
    // Muy rígido, amarrado a pintar Toasts visuales por siempre
    addToast({ type: 'error', message: 'Fallo al pagar' });
  }
}
```

### ✅ DESPUÉS (Arquitectura Desacoplada e Inteligente)

#### 1. El Puente (Bridge + Factory)
Separamos el Transporte (Sender) del Tipo (Notification).

```typescript
/* src/services/notificationBridge.ts */

// --- IMPLEMENTACIÓN (Los Transportistas) ---
export class ToastSender {
  send(message, type) { useNotificationStore.getState().addToast({ type, message }); }
}
export class EmailSender {
  send(message, type) { console.log("Simulando envío Backend Email..."); }
}

// --- ABSTRACCIÓN (Los Mensajes y Lógica Frontal) ---
export class UrgentNotification {
  constructor(sender) { this.sender = sender; } // <-- El puente!
  notify(message, type) { 
    this.sender.send(`🚨 URGENTE: ${message.toUpperCase()}`, type); 
  }
}

// --- FACTORY (El Constructor) ---
export class NotificationFactory {
  static create(type, channel) {
    // Factory une 'toast' con 'UrgentNotification' y los devuelve armados.
  }
}
```

#### 2. El Frontend (Consumidor)
Ya no importamos hooks locales en la lógica de negocio profunda.

```javascript
/* src/pages/Catalog.jsx (AHORA) */
import { NotificationFactory } from '../services/notificationBridge';

export default function Catalog() {

  const handleEnroll = () => {
    // 🌉 PATRÓN BRIDGE: Pedimos un mensaje crítico que se renderice como TOAST
    const errorNotif = NotificationFactory.create('urgent', 'toast');
    errorNotif.notify('Fallo al pagar', 'error');

    // MÁGIA: Si mañana el cliente pide que ese error llegue por correo,
    // cambiamos un String sin romper NADA de la plataforma:
    // const errorNotif = NotificationFactory.create('urgent', 'email');
  }
}
```

## 🚀 Beneficios Alcanzados
- **Escalabilidad Vectorial:** Podemos multiplicar los Tipos de Mensajes sin afectar a los Canales de Envío, y viceversa.
- **Inversión de Dependencias:** React (`Catalog.jsx`) ya no depende de Zustand (`useNotificationStore`). React depende de un Servicio Agonóstico (`NotificationBridge`) que por debajo delega en Zustand, manteniendo libre la capa de presentación.
