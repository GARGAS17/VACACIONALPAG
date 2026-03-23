import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function MyCoursesView({ onExplore }) {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    async function loadMyCourses() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            payment_status,
            completion_status,
            paid_amount,
            enrolled_at,
            courses (
              id,
              title,
              description,
              start_date,
              end_date,
              start_time,
              end_time,
              days_of_week,
              professors (
                name
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        setEnrollments(data || []);
      } catch (err) {
        console.error('Error cargando cursos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMyCourses();
  }, [user]);

  // Aggregates
  const totalCursos = enrollments.length;
  const pagosConfirmados = enrollments.filter(e => ['paid', 'completed'].includes(e.payment_status)).length;
  const inversionTotal = enrollments
    .filter(e => ['paid', 'completed'].includes(e.payment_status))
    .reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-xl text-indigo-500">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mis Cursos</h1>
            <p className="text-xs text-slate-400">Hola, gestiona tus inscripciones</p>
          </div>
        </div>
        <button 
          onClick={onExplore}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border-none cursor-pointer shadow transition-colors"
        >
          Explorar más cursos
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner"></div></div>
      ) : (
        <>
          {/* Aggregate Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-indigo-600 m-0">{totalCursos}</p>
              <p className="text-slate-400 text-xs mt-1 m-0">Cursos inscritos</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600 m-0">{pagosConfirmados}</p>
              <p className="text-slate-400 text-xs mt-1 m-0">Pagos confirmados</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-800 m-0">US$ {inversionTotal.toFixed(2)}</p>
              <p className="text-slate-400 text-xs mt-1 m-0">Inversión total</p>
            </div>
          </div>

          {/* List/Grid of courses */}
          {enrollments.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-400 mx-auto mb-4">
                <BookOpen size={30} />
              </div>
              <h3 className="text-slate-800 font-bold mb-1">Aún no tienes inscripciones</h3>
              <p className="text-slate-400 text-xs mb-5">Explora el catálogo y encuentra el curso perfecto para ti</p>
              <button 
                onClick={onExplore}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border-none cursor-pointer transition-colors shadow"
              >
                Explorar cursos →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {enrollments.map((item) => {
                const course = item.courses;
                const professorName = course?.professors?.name || 'Instructor Gral';
                const initial = professorName.charAt(0).toUpperCase();

                let statusBadge = 'bg-slate-100 text-slate-600';
                if (['paid', 'completed'].includes(item.payment_status)) statusBadge = 'bg-green-500/10 text-green-600';
                if (item.payment_status === 'pending') statusBadge = 'bg-yellow-500/10 text-yellow-600';

                return (
                  <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                      {item.payment_status === 'paid' ? 'Pagado' : item.payment_status}
                    </span>

                    <div>
                      <h3 className="text-slate-800 font-bold text-sm mb-1 pr-16">{course?.title}</h3>
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-5 h-5 bg-indigo-50 border border-white rounded-full flex items-center justify-center text-indigo-500 font-bold text-[10px]">
                          {initial}
                        </div>
                        <span className="text-slate-400 text-[11px]">{professorName}</span>
                      </div>
                      
                      <div className="space-y-1.5 text-slate-500 text-xs mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{course?.days_of_week || 'Lunes a Viernes'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{course?.start_time?.slice(0, 5)} - {course?.end_time?.slice(0,5)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-50 pt-3 mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <CheckCircle2 size={13} className={item.completion_status === 'completed' ? 'text-green-500' : 'text-slate-300'} />
                        {item.completion_status === 'completed' ? 'Completado' : 'En Progreso'}
                      </div>
                      <button 
                        onClick={() => setSelectedEnrollment(item)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[11px] font-semibold border-none cursor-pointer"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {selectedEnrollment && (
            <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setSelectedEnrollment(null) }}>
              <div className="modal-content relative max-w-lg w-full">
                <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer" onClick={() => setSelectedEnrollment(null)}>
                  ✕
                </button>
                <div className="modal-body p-6">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 mb-2 inline-block">
                    Inscripción Activa
                  </span>
                  <h2 className="text-xl font-black text-slate-800 mb-1">{selectedEnrollment.courses?.title}</h2>
                  <p className="text-slate-500 text-xs mb-4">{selectedEnrollment.courses?.description || 'Profundiza tus conocimientos con este curso.'}</p>

                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Estado de Pago:</span>
                      <span className="font-bold text-green-600 capitalize">{selectedEnrollment.payment_status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Fecha Inscripción:</span>
                      <span className="text-slate-700 font-bold">{new Date(selectedEnrollment.enrolled_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Horario Clase:</span>
                      <span className="text-slate-700 font-bold">{selectedEnrollment.courses?.start_time?.slice(0,5)} - {selectedEnrollment.courses?.end_time?.slice(0,5)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                    <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center rounded-xl text-indigo-500">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 m-0">INSTRUCTOR</p>
                      <p className="text-xs font-bold text-slate-800 m-0">{selectedEnrollment.courses?.professors?.name || 'Instructor Gral.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
