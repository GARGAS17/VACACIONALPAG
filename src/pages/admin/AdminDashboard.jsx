import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { DollarSign, TrendingUp, Users, BookOpen, BarChart3, Award, Download } from 'lucide-react';

const fetchAdminMetrics = async () => {
  const [coursesRes, enrollmentsRes] = await Promise.all([
    supabase.from('courses').select('id, title, enrolled_count, capacity, price, status'),
    supabase.from('enrollments').select('id, payment_status, courses(price)'),
  ]);

  if (coursesRes.error) throw coursesRes.error;
  if (enrollmentsRes.error) throw enrollmentsRes.error;

  const courses = coursesRes.data || [];
  const enrollments = enrollmentsRes.data || [];

  const paidEnrollments = enrollments.filter((e) => e.payment_status === 'completed');
  const totalRevenue = paidEnrollments.reduce((sum, e) => {
    const c = e.courses;
    const price = Array.isArray(c) ? (c[0]?.price ?? 0) : (c?.price ?? 0);
    return sum + price;
  }, 0);

  const topCourse = courses.reduce(
    (best, c) => (!best || c.enrolled_count > best.enrolled_count ? c : best),
    null
  );

  const totalCapacity = courses.reduce((s, c) => s + c.capacity, 0);
  const totalEnrolled = courses.reduce((s, c) => s + c.enrolled_count, 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return {
    totalRevenue,
    topCourse: topCourse ? { title: topCourse.title, enrolled_count: topCourse.enrolled_count } : null,
    occupancyPercent,
    totalEnrollments: enrollments.length,
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === 'published').length,
  };
};

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-white mb-1 m-0">{value}</p>
    <p className="text-slate-400 text-sm font-medium m-0">{label}</p>
    {sub && <p className="text-slate-500 text-xs mt-1 m-0">{sub}</p>}
  </div>
);

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminMetrics()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-400">
        Error cargando métricas: {error}
      </div>
    );
  }

  const fmt = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8 font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 m-0">Dashboard de Administración</h1>
          <p className="text-slate-400 text-sm m-0">Resumen general de la plataforma en tiempo real</p>
        </div>
        <button
          onClick={() => {
            const csv = `Métrica,Valor\nIngresos Totales,$${metrics?.totalRevenue?.toFixed(2) ?? 0}\nInscripciones,${metrics?.totalEnrollments ?? 0}\nCursos,${metrics?.totalCourses ?? 0}\nOcupación,${metrics?.occupancyPercent ?? 0}%`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'reporte-admin.csv'; a.click();
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors w-max cursor-pointer border-none"
        >
          <Download size={15} />
          Exportar Reporte
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Ingresos Totales (pagos completados)"
          value={fmt(metrics?.totalRevenue ?? 0)}
          icon={DollarSign}
          color="bg-green-600"
        />
        <StatCard
          label="Total de Inscripciones"
          value={String(metrics?.totalEnrollments ?? 0)}
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          label="Ocupación Total"
          value={`${metrics?.occupancyPercent ?? 0}%`}
          sub="Cupos ocupados sobre capacidad total"
          icon={BarChart3}
          color="bg-purple-600"
        />
        <StatCard
          label="Total de Cursos"
          value={String(metrics?.totalCourses ?? 0)}
          sub={`${metrics?.publishedCourses ?? 0} publicados`}
          icon={BookOpen}
          color="bg-orange-600"
        />
        <StatCard
          label="Curso Más Popular"
          value={metrics?.topCourse?.title ?? '—'}
          sub={`${metrics?.topCourse?.enrolled_count ?? 0} inscritos`}
          icon={Award}
          color="bg-yellow-600"
        />
        <StatCard
          label="Tendencia"
          value="↑ Activo"
          sub="Sistema operando con normalidad"
          icon={TrendingUp}
          color="bg-indigo-600"
        />
      </div>
    </div>
  );
};
