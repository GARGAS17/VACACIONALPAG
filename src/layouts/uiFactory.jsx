import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, User, CreditCard, GraduationCap, Settings, 
  HelpCircle, LogOut, LayoutDashboard, Users, ClipboardList 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// === 1. INTERFAZ ABSTRACTA (Abstract Factory) ===
class UIFactory {
  getSidebarItems() { throw new Error("Debe implementarse"); }
  getShellStyles() { throw new Error("Debe implementarse"); }
  getSidebarStyles() { throw new Error("Debe implementarse"); }
}

// === 2. FACTORÍA CONCRETA: ESTUDIANTE ===
class StudentUIFactory extends UIFactory {
  constructor(profile) {
    super();
    this.profile = profile;
  }

  getSidebarItems() {
    const items = [
      { to: '/dashboard/inicio', label: 'Inicio', icon: Home },
      { to: '/dashboard/cursos', label: 'Cursos', icon: BookOpen },
      { to: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
      { to: '/dashboard/pagos', label: 'Pagos', icon: CreditCard },
      { to: '/dashboard/mis_cursos', label: 'Mis Cursos', icon: GraduationCap },
      { to: '/dashboard/ajustes', label: 'Ajustes', icon: Settings },
      { to: '/dashboard/ayuda', label: 'Ayuda', icon: HelpCircle },
    ];

    // Si es administrador navegando como estudiante, agregamos acceso rápido
    if (this.profile?.role === 'admin') {
      items.push({ to: '/admin', label: 'Vista Admin 👑', icon: LayoutDashboard });
    }

    return items;
  }

  getShellStyles() {
    return 'bg-slate-50'; // Tema claro para estudiante
  }

  getSidebarStyles() {
    return 'navigation'; // Clase CSS existente para sidebar curvo
  }
}

// === 3. FACTORÍA CONCRETA: ADMINISTRADOR ===
class AdminUIFactory extends UIFactory {
  getSidebarItems() {
    return [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/professors', label: 'Profesores', icon: Users },
      { to: '/admin/courses', label: 'Cursos', icon: BookOpen },
      { to: '/admin/enrollments', label: 'Inscripciones', icon: ClipboardList },
    ];
  }

  getShellStyles() {
    return 'bg-slate-950 text-white'; // Tema oscuro para Admin
  }

  getSidebarStyles() {
    return 'admin-sidebar bg-slate-900 border-r border-slate-800'; // Estilos específicos Admin
  }
}

// === 🏭 FACTORY PROVIDER ===
export class UIFactoryProvider {
  static getFactory(role = 'student', profile = null) {
    if (role === 'admin') {
      return new AdminUIFactory();
    }
    return new StudentUIFactory(profile);
  }
}
