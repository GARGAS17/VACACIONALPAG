import React from 'react';
import { ShieldAlert, Mail, AlertOctagon, Info } from 'lucide-react';

export default function WafBlockedScreen() {
  // Generar un ID de referencia falso estilo Cloudflare para darle un toque profesional
  const rayId = Math.random().toString(36).substring(2, 15).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-slate-200 font-sans selection:bg-red-500/30 overflow-y-auto">
      {/* Background Glows (Fijos al fondo) */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-orange-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative z-10">
        
        <div className="w-full max-w-2xl bg-[#111111] border border-red-900/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl my-auto">
          
          {/* Top accent line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

          <div className="p-6 sm:p-10 md:p-12">
            {/* Icon Header */}
            <div className="flex justify-center mb-6 sm:mb-8 relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="p-4 sm:p-5 bg-red-500/10 rounded-full border border-red-500/20 relative z-10">
                <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-2 tracking-tight">
              Acceso Restringido
            </h1>
            <p className="text-center text-red-400 font-medium mb-6 sm:mb-8 text-sm sm:text-base">
              Código de Error: WAF_SECURITY_BLOCK
            </p>
            
            <div className="space-y-6 text-slate-300">
              <p className="text-base sm:text-lg text-center leading-relaxed">
                Hemos detectado actividad inusual proveniente de tu red y nuestro 
                <strong className="text-white font-semibold"> Firewall de Aplicaciones Web (WAF) </strong> 
                ha bloqueado tu acceso de forma automática para proteger la integridad del sistema.
              </p>
              
              {/* Info Box */}
              <div className="bg-[#1a1a1a] p-5 sm:p-6 rounded-xl border border-slate-800/50 shadow-inner">
                <h2 className="flex items-center text-slate-200 font-semibold mb-3 text-base sm:text-lg">
                  <AlertOctagon className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" />
                  ¿Por qué fui bloqueado?
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Esta acción defensiva se activa cuando el sistema identifica firmas de tráfico que coinciden con intentos de vulneración conocidos (como inyección SQL, evasión de parámetros o tráfico malicioso).
                </p>
                <div className="flex items-start p-3 bg-green-/20 border border-green-/30 rounded-lg">
                  <Info className="w-5 h-5 text-green- mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-green-/70">
                    Todas nuestras políticas de detección y bloqueo están estructuradas bajo los estándares internacionales de ciberseguridad del <strong className="text-green-">OWASP Top 10</strong> y la arquitectura de defensa activa.
                  </p>
                </div>
              </div>
              
              {/* Contact Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-[#151515] p-4 sm:p-5 rounded-xl border border-slate-800/80 gap-4 sm:gap-0">
                <div className="flex items-center w-full sm:w-auto">
                  <div className="p-2 bg-slate-800 rounded-lg mr-4 flex-shrink-0">
                    <Mail className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">¿Crees que es un falso positivo?</h3>
                    <p className="text-xs text-slate-500">Por favor contacta con nuestro equipo.</p>
                  </div>
                </div>
                <a 
                  href={`mailto:soporte@vacacionalpag.com?subject=Desbloqueo de IP - Ray ID: ${rayId}`} 
                  className="w-full sm:w-auto px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg transition-colors text-sm font-semibold text-center flex-shrink-0"
                >
                  Contactar Soporte
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="mt-8 mb-4 text-slate-600 text-[10px] sm:text-xs text-center space-y-1">
          <p>Ray ID: <span className="font-mono text-slate-400">{rayId}</span> &bull; Tu dirección IP ha sido registrada de forma segura.</p>
          <p>Protegido por Clean Architecture WAF Guard</p>
        </div>
      </div>
    </div>
  );
}
