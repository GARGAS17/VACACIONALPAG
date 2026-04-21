import { useNotificationStore } from './useNotificationStore';

// ====================================================================
// 🌉 PATRÓN BRIDGE + FACTORY - Sistema de Notificaciones
// ====================================================================
// El Bridge separa "Por dónde se envía" (Implementación) 
// de "Qué tipo de notificación es" (Abstracción).
// El Factory facilita su ensamblaje.
// ====================================================================

// ──────────────────────────────────────────────────────────
// 1. LA IMPLEMENTACIÓN (Los Canales de Envío)
// ──────────────────────────────────────────────────────────
export interface INotificationSender {
  send(message: string, type: 'success' | 'error' | 'info'): void;
}

export class ToastSender implements INotificationSender {
  send(message: string, type: 'success' | 'error' | 'info') {
    // Se inserta directamente en nuestro Zustand State de UI
    useNotificationStore.getState().addToast({ type, message });
  }
}

export class AlertSender implements INotificationSender {
  send(message: string, type: 'success' | 'error' | 'info') {
    // Ventana clásica del navegador
    window.alert(`[${type.toUpperCase()}] ${message}`);
  }
}

export class EmailSender implements INotificationSender {
  send(message: string, type: 'success' | 'error' | 'info') {
    // Simula el envío de un correo electrónico a un servidor backend
    console.log(`📧 [EMAIL SERVER]: Enviando notificación... -> [${type.toUpperCase()}] ${message}`);
  }
}

// ──────────────────────────────────────────────────────────
// 2. LA ABSTRACCIÓN (Los Tipos de Notificación)
// ──────────────────────────────────────────────────────────
export abstract class NotificationAbstraction {
  protected sender: INotificationSender; // ⬅️ ESTE ES EL 'PUENTE' (Bridge)

  constructor(sender: INotificationSender) {
    this.sender = sender;
  }

  abstract notify(message: string, type?: 'success' | 'error' | 'info'): void;
}

// 2A. Notificación Normal (La pasa tal cual)
export class StandardNotification extends NotificationAbstraction {
  notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.sender.send(message, type);
  }
}

// 2B. Notificación Urgente (La formatea, hace mayúsculas y añade sirenas)
export class UrgentNotification extends NotificationAbstraction {
  notify(message: string, type: 'success' | 'error' | 'info' = 'error') {
    const urgentMessage = `🚨 URGENTE: ${message.toUpperCase()}`;
    this.sender.send(urgentMessage, type);
  }
}

// 2C. Notificación de Sistema (Silenciosa, para auditorías de app)
export class SystemNotification extends NotificationAbstraction {
  notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const formattedMessage = `⚙️ [SISTEMA]: ${message}`;
    this.sender.send(formattedMessage, type);
  }
}

// ──────────────────────────────────────────────────────────
// 3. FACTORY (El ensamblador del puente)
// ──────────────────────────────────────────────────────────
export class NotificationFactory {
  /**
   * Une la abstracción (tipo) con la implementación (canal).
   */
  static create(
    type: 'standard' | 'urgent' | 'system' = 'standard',
    channel: 'toast' | 'alert' | 'email' = 'toast'
  ): NotificationAbstraction {
    
    // Paso 1: Instanciar la Implementación (Canal)
    let sender: INotificationSender;
    switch (channel) {
      case 'alert': sender = new AlertSender(); break;
      case 'email': sender = new EmailSender(); break;
      case 'toast': 
      default: 
        sender = new ToastSender(); break;
    }

    // Paso 2: Instanciar la Abstracción cruzando el puente
    switch (type) {
      case 'urgent': return new UrgentNotification(sender);
      case 'system': return new SystemNotification(sender);
      case 'standard':
      default:
        return new StandardNotification(sender);
    }
  }
}
