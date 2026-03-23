import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Search, ClipboardList } from 'lucide-react';

const statusColors = {
  active: 'bg-green-500/15 text-green-400',
  completed: 'bg-green-500/15 text-green-400',
  paid: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-red-500/15 text-red-400',
  refunded: 'bg-slate-500/15 text-slate-400',
};

const statusLabels = {
  active: 'Pagado',
  completed: 'Pagado',
  paid: 'Pagado',
  pending: 'Pendiente',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

export const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (title, price),
          profiles (full_name)
        `)
        .order('enrolled_at', { ascending: false });
        
      if (error) throw error;
      setEnrollments(data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const filtered = enrollments.filter((e) =>
    (e.courses?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = enrollments
    .filter((e) => e.payment_status === 'completed' || e.payment_status === 'active' || e.payment_status === 'paid')
    .reduce((sum, e) => sum + (e.paid_amount ? Number(e.paid_amount) : Number(e.courses?.price || 0)), 0);

  return (
    <div className="p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 m-0">Inscripciones</h1>
          <p className="text-slate-400 text-sm m-0">
            {enrollments.length} inscripciones totales ·{' '}
            <span className="text-green-400">
              ${totalRevenue.toFixed(2)} recaudados
            </span>
          </p>
        </div>
        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
          <ClipboardList size={20} className="text-indigo-400" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por estudiante o curso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-slate-800 border-none rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estudiante</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Curso</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado pago</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan="5">
                    <div className="h-7 bg-slate-700 rounded-lg animate-pulse" />
                  </td>
                </tr>
              ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    No se encontraron inscripciones.
                  </td>
                </tr>
              )
              : filtered.map((enrollment) => {
                const amountDisp = enrollment.paid_amount ? Number(enrollment.paid_amount) : Number(enrollment.courses?.price || 0);
                return (
                  <tr key={enrollment.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-200 text-sm font-medium">
                      {enrollment.profiles?.full_name || <span className="text-slate-500 italic">Anónimo</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {enrollment.courses?.title || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      ${amountDisp.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[enrollment.payment_status] || statusColors.pending}`}>
                        {statusLabels[enrollment.payment_status] || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(enrollment.enrolled_at || enrollment.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};
