import { create } from 'zustand'
   
   export interface Toast {
     id: string
     type: 'success' | 'error' | 'info'
     message: string
     duration?: number
   }
   
   interface NotificationState {
     toasts: Toast[]
     addToast: (toast: Omit<Toast, 'id'>) => void
     removeToast: (id: string) => void
   }
   
   export const useNotificationStore = create<NotificationState>((set) => ({
     toasts: [],
     addToast: (toast) =>
       set((state) => ({
         toasts: [
           ...state.toasts,
           { ...toast, id: Date.now().toString() },
         ],
       })),
     removeToast: (id) =>
       set((state) => ({
         toasts: state.toasts.filter((t) => t.id !== id),
       })),
   }))