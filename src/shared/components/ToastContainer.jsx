import React, { useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import './ToastContainer.css';

const icons = {
  success: <CheckCircle2 size={18} className="toast-icon success" />,
  error: <XCircle size={18} className="toast-icon error" />,
  info: <Info size={18} className="toast-icon info" />
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000); // reduced duration slightly for snappiness
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className={`toast-item toast-${toast.type} slide-in`}>
      <div className="toast-content">
        <span className="toast-icon-wrapper">
           {icons[toast.type]}
        </span>
        <p className="toast-message">{toast.message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}
