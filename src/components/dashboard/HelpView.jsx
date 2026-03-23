import React, { useState } from 'react';
import { MessageSquare, FileText, Ticket, Play, ChevronDown, HelpCircle } from 'lucide-react';

export default function HelpView() {
  const [activeFaq, setActiveFaq] = useState(null);

  const popularQuestions = [
    { q: "¿Cómo me inscribo a un curso?", a: "Para inscribirte, ve al Catálogo de Cursos, haz clic en el botón de inscribir que aparece en el curso que te interesa y sigue los pasos para pagar por Stripe." },
    { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos tarjetas de Crédito y Débito (Visa, Mastercard, etc.) procesadas de manera segura mediante Stripe." },
    { q: "¿Cuándo empiezan las clases?", a: "Las fechas de inicio y fin de cada asignatura están detalladas en la ficha técnica de cada curso dentro del catálogo. Usualmente empiezan en temporada vacacional." },
    { q: "¿Cómo descargo mi certificado?", a: "Una vez completado el curso al 100%, podrás ver un botón de descarga en tu panel de 'Mis Cursos'." }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Centro de Ayuda</h1>
        <p className="text-sm text-slate-500">¿En qué podemos ayudarte hoy?</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Chat box */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-slate-800 font-bold text-sm mb-1">Chatea con Soporte</h3>
          <p className="text-slate-400 text-xs mb-4">Nuestro equipo está listo para ayudarte en tiempo real</p>
          <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border-none cursor-pointer transition-colors shadow">
            Iniciar Chat
          </button>
        </div>

        {/* FAQs box */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h3 className="text-slate-800 font-bold text-sm mb-1">Preguntas Frecuentes</h3>
          <p className="text-slate-400 text-xs mb-4">Revisa nuestra base de conocimientos</p>
          <button className="px-5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border-none cursor-pointer transition-colors">
            Ver Artículos
          </button>
        </div>

        {/* Tickets box */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
            <Ticket size={28} />
          </div>
          <h3 className="text-slate-800 font-bold text-sm mb-1">Crear un Ticket</h3>
          <p className="text-slate-400 text-xs mb-4">Envía una solicitud detallada a nuestro equipo</p>
          <button className="px-5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border-none cursor-pointer transition-colors">
            Crear Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Preguntas Más Populares (Accordion) */}
        <div>
          <div className="flex items-center gap-1.5 text-slate-800 mb-4 text-sm font-bold">
            <HelpCircle size={18} className="text-indigo-500" /> Preguntas más populares
          </div>
          <div className="space-y-2">
            {popularQuestions.map((qa, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between border-none bg-transparent cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-slate-700 font-semibold text-xs">{qa.q}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-1 bg-slate-50/50 text-[11px] text-slate-500 border-t border-slate-50">
                      {qa.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Guías Rápidas / Videos tutoriales */}
        <div>
          <div className="flex items-center gap-1.5 text-slate-800 mb-4 text-sm font-bold">
            <Play size={18} className="text-red-500" /> Guías en video
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="aspect-video bg-slate-200 hover:bg-slate-300 rounded-2xl flex items-center justify-center cursor-pointer transition-all text-slate-400 group relative shadow-sm overflow-hidden border border-slate-100">
                <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                  <Play size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
