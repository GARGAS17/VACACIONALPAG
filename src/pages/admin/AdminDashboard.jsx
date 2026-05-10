import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { DollarSign, TrendingUp, Users, BookOpen, BarChart3, Award, Download } from 'lucide-react';
import { DashboardMetricsReport, CSVFormatter, JSONFormatter } from '../../services/reportBridge';
import { metricsService } from '../../services/proxies';

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
  const [exportFormat, setExportFormat] = useState('csv');

  const handleExport = () => {
    if (!metrics) return;
    // 🌉 APLICANDO EL PATRÓN BRIDGE
    const formatter = exportFormat === 'csv' ? new CSVFormatter() : new JSONFormatter();
    const report = new DashboardMetricsReport(formatter);
    report.export('reporte-admin-dashboard', metrics);
  };

  useEffect(() => {
    // 🕵️ APLICANDO EL PATRÓN PROXY (Caché)
    metricsService.getDashboardMetrics()
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
        <div className="flex items-center gap-3">
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="csv">Formato CSV</option>
            <option value="json">Formato JSON</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors w-max cursor-pointer border-none"
          >
            <Download size={15} />
            Exportar Reporte
          </button>
        </div>
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
