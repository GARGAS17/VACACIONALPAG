import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, User, CreditCard, GraduationCap, Settings, 
  HelpCircle, LogOut, LayoutDashboard, Users, ClipboardList,
  Shield, Key
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { MenuItem, MenuGroup } from '../patterns/MenuComposite';

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
    // 🌳 APLICANDO COMPOSITE: En lugar de un simple array, construimos un árbol
    
    const rootMenu = new MenuGroup('Menú Principal', null);

    // Hojas simples (Leaf)
    rootMenu.add(new MenuItem('Inicio', Home, '/dashboard/inicio'));
    rootMenu.add(new MenuItem('Catálogo', BookOpen, '/dashboard/cursos'));
    rootMenu.add(new MenuItem('Mis Cursos', GraduationCap, '/dashboard/mis_cursos'));
    rootMenu.add(new MenuItem('Pagos', CreditCard, '/dashboard/pagos'));

    // Grupo de Configuración (Composite anidado)
    const settingsGroup = new MenuGroup('Configuración', Settings);
    settingsGroup.add(new MenuItem('Mi Perfil', User, '/dashboard/perfil'));
    settingsGroup.add(new MenuItem('Ayuda', HelpCircle, '/dashboard/ayuda'));
    
    rootMenu.add(settingsGroup);

    // Si es administrador, le agregamos un grupo especial con acceso admin
    if (this.profile?.role === 'admin') {
      const adminGroup = new MenuGroup('Opciones Root', Shield);
      adminGroup.add(new MenuItem('Vista Admin 👑', LayoutDashboard, '/admin'));
      rootMenu.add(adminGroup);
    }

    // Al pedir getFlatItems() al root, aplanamos el árbol para no romper el CSS del Menú animado
    return rootMenu.getFlatItems(); 
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
    // 🌳 APLICANDO COMPOSITE (Estructura plana para Admin Panel según diseño)
    const rootMenu = new MenuGroup('Admin Menu', null);

    rootMenu.add(new MenuItem('Dashboard', LayoutDashboard, '/admin'));
    rootMenu.add(new MenuItem('Profesores', Users, '/admin/professors'));
    rootMenu.add(new MenuItem('Cursos', BookOpen, '/admin/courses'));
    rootMenu.add(new MenuItem('Inscripciones', ClipboardList, '/admin/enrollments'));

    return rootMenu.renderData().children;
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
