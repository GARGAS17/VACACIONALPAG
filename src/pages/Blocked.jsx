import React from 'react';
import { ShieldAlert, Info, Mail, AlertOctagon } from 'lucide-react';

export default function Blocked() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full bg-[#0f172a] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/10">
        
        {/* Header (Red alert area) */}
        <div className="bg-red-500/10 p-6 sm:p-8 flex flex-col items-center border-b border-red-500/20">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-500/20 flex items-center justify-center rounded-full mb-6 ring-4 ring-red-500/10">
            <ShieldAlert className="text-red-500 w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 text-center">Acceso Denegado</h1>
          <p className="text-red-400 font-medium text-center text-sm sm:text-base">
            Se ha detectado una violación crítica de seguridad
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Nuestros sistemas automatizados de protección (<strong className="text-white">Web Application Firewall</strong>) han interceptado actividad inusual o maliciosa proveniente de tu conexión. Para proteger la integridad de los datos, tu acceso ha sido suspendido de manera indefinida.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-700/50 flex gap-4 items-start">
              <div className="mt-1">
                <AlertOctagon className="text-orange-400 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Motivo del Bloqueo</p>
                <p className="text-slate-300 text-sm">Carga útil maliciosa interceptada (Posible intento de Inyección SQL / Modificación de sintaxis).</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-700/50 flex gap-4 items-center">
              <div>
                <Info className="text-indigo-400 w-5 h-5" />
              </div>
              <div className="w-full flex justify-between items-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Código de Error</p>
                <span className="bg-red-500/10 text-red-400 font-mono text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">
                  ERR_WAF_IP_BLOCKED
                </span>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-white font-bold mb-2 text-sm">¿Crees que esto es un error?</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">
              Si estás usando una red pública o crees que el sistema marcó tu actividad por error (falso positivo), por favor contacta a nuestro equipo de soporte técnico.
            </p>
            <a 
              href="mailto:soporte@vacacionalpag.com" 
              className="inline-flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-slate-700 hover:border-slate-600 text-sm"
            >
              <Mail className="w-4 h-4" />
              Contactar Soporte
            </a>
          </div>
        </div>
        
      </div>
    </div>
  );
}
