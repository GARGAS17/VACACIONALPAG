import React from 'react';
import { LayoutDashboard, GraduationCap } from 'lucide-react';

export default function RoleSelect({ onSelect }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-[5000]">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-3 border border-indigo-500/20">
          <GraduationCap size={24} />
        </div>
        <h1 className="text-2xl font-black text-white m-0">Elige tu rol de acceso</h1>
        <p className="text-slate-400 text-sm mt-1 m-0">Selecciona el modo en el que deseas navegar la plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
        {/* Card Admin */}
        <button 
          onClick={() => onSelect('admin')}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <LayoutDashboard size={24} />
          </div>
          <h3 className="text-white font-bold text-lg mb-1 m-0">Administrador</h3>
          <p className="text-slate-400 text-xs m-0">Gestiona profesores, cursos, matrículas y métricas globales.</p>
        </button>

        {/* Card Student */}
        <button 
          onClick={() => onSelect('student')}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left cursor-pointer hover:border-green-500 hover:bg-slate-800/50 transition-all group"
        >
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-white font-bold text-lg mb-1 m-0">Estudiante</h3>
          <p className="text-slate-400 text-xs m-0">Explora el catálogo, gestiona tus pagos y visualiza tus clases.</p>
        </button>
      </div>
    </div>
  );
}
