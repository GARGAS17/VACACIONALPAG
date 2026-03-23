import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  LogOut,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/useAuthStore';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/professors', label: 'Profesores', icon: Users, end: false },
  { to: '/admin/courses', label: 'Cursos', icon: BookOpen, end: false },
  { to: '/admin/enrollments', label: 'Inscripciones', icon: ClipboardList, end: false },
];

export const AdminLayout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (signOut) signOut();
    sessionStorage.clear();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm m-0">Admin Panel</p>
              <p className="text-slate-400 text-xs m-0">Cursos Vacacionales</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group no-underline ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-indigo-300" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: Back to app + Sign Out */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <NavLink
            to="/dashboard/inicio"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all no-underline"
          >
            <GraduationCap size={18} className="text-slate-500" />
            Volver a la App
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
};
