import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function PaymentsView() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);

  useEffect(() => {
    async function loadPayments() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            currency,
            status,
            created_at,
            last_4_digits,
            payment_method,
            stripe_customer_id,
            enrollments (
              id,
              courses (
                title
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error('Error cargando pagos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [user]);

  // Aggregates
  const totalInvertido = payments
    .filter(p => ['paid', 'completed'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const pagosCompletados = payments.filter(p => ['paid', 'completed'].includes(p.status)).length;
  const pagosPendientes = payments.filter(p => p.status === 'pending').length;

  const lastCardItem = payments.find(p => p.last_4_digits);

  const handleChangeCard = async () => {
    setIsUpdatingCard(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('https://vpwhhwiowybztoxzyama.supabase.co/functions/v1/manage-billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido del servidor');
      
      if (data?.url) window.location.assign(data.url);
    } catch (err) {
      alert(err.message || 'Error al conectar con Stripe. Asegúrate de tener un pago previo registrado.');
    } finally {
      setIsUpdatingCard(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Pagos</h1>
        <p className="text-sm text-slate-500">Historial de transacciones y estados de inscripción</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner"></div></div>
      ) : (
        <>
          {/* Aggregate Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="text-slate-400 text-xs m-0">TOTAL INVERTIDO</p>
              <p className="text-2xl font-black text-slate-800 mt-1 m-0">${totalInvertido.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="text-slate-400 text-xs m-0">PAGOS COMPLETADOS</p>
              <p className="text-green-600 text-2xl font-black mt-1 m-0">{pagosCompletados}</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="text-slate-400 text-xs m-0">PENDIENTES</p>
              <p className="text-yellow-600 text-2xl font-black mt-1 m-0">{pagosPendientes}</p>
            </div>
          </div>

          {/* Historial Reciente */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mb-6">
            <h3 className="text-slate-800 font-bold text-sm mb-4">Historial Reciente</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-slate-400 text-[10px] uppercase font-bold">ID Transacción</th>
                    <th className="pb-3 text-slate-400 text-[10px] uppercase font-bold">Curso / Concepto</th>
                    <th className="pb-3 text-slate-400 text-[10px] uppercase font-bold">Fecha</th>
                    <th className="pb-3 text-slate-400 text-[10px] uppercase font-bold">Monto</th>
                    <th className="pb-3 text-slate-400 text-[10px] uppercase font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((t) => {
                    const courseTitle = t.enrollments?.courses?.title || 'Curso General';
                    let statusClass = 'bg-slate-500/10 text-slate-600';
                    if (['paid', 'completed'].includes(t.status)) statusClass = 'bg-green-500/10 text-green-600';
                    if (t.status === 'pending') statusClass = 'bg-yellow-500/10 text-yellow-600';
                    if (['failed', 'cancelled'].includes(t.status)) statusClass = 'bg-red-500/10 text-red-600';

                    return (
                      <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 text-slate-400 text-xs font-mono">{t.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3.5 text-slate-800 text-xs font-semibold">{courseTitle}</td>
                        <td className="py-3.5 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-slate-800 text-xs font-bold">${Number(t.amount).toFixed(2)}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>
                            {t.status === 'paid' ? 'Completado' : t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {payments.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-8 text-slate-400 text-xs">No hay transacciones registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Método de Pago Predeterminado */}
          {lastCardItem && lastCardItem.last_4_digits && lastCardItem.stripe_customer_id !== 'unknown' && lastCardItem.last_4_digits !== 'unknown' && (
            <div className="p-5 bg-indigo-600 rounded-2xl flex items-center justify-between shadow-lg text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CreditCard size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold m-0">Método de Pago Predeterminado</p>
                  <p className="text-xs text-indigo-100 mt-0.5 m-0">Tarjeta terminada en •••• {lastCardItem.last_4_digits}</p>
                  <p className="text-[11px] text-indigo-200 mt-0.5 m-0">Marca: {lastCardItem.payment_method || 'S/D'}</p>
                </div>
              </div>
              <button 
                onClick={handleChangeCard} 
                disabled={isUpdatingCard}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-indigo-600 rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm transition-colors disabled:opacity-50"
              >
                {isUpdatingCard ? 'Cargando...' : 'CAMBIAR TARJETA'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
