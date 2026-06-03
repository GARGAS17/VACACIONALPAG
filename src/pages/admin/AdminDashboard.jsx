import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { DollarSign, TrendingUp, Users, BookOpen, BarChart3, Award, Download, Sparkles, X, Loader2 } from 'lucide-react';
import { DashboardMetricsReport, CSVFormatter, JSONFormatter } from '../../services/reportBridge';
import { aiTrendAnalyzer } from '../../services/aiAdapter';
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
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [insightsText, setInsightsText] = useState('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const handleExport = () => {
    if (!metrics) return;
    // 🌉 APLICANDO EL PATRÓN BRIDGE
    const formatter = exportFormat === 'csv' ? new CSVFormatter() : new JSONFormatter();
    const report = new DashboardMetricsReport(formatter);
    report.export('reporte-admin-dashboard', metrics);
  };

  const handleGenerateInsights = async () => {
    setIsInsightsOpen(true);
    if (insightsText) return; 
    setIsGeneratingInsights(true);
    try {
      const response = await aiTrendAnalyzer.generateInsights(metrics);
      setInsightsText(response);
    } catch (err) {
      setInsightsText("Error: " + err.message);
    } finally {
      setIsGeneratingInsights(false);
    }
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
          <button
            onClick={handleGenerateInsights}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md border-none cursor-pointer"
          >
            <Sparkles size={16} />
            Insights IA
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#334155', margin: '0 4px' }}></div>
          
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

      {/* Modal Insights */}
      {isInsightsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-700 max-h-[85vh]">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg m-0">Análisis Estratégico IA</h3>
                  <p className="text-white/80 text-xs m-0">Generado en tiempo real</p>
                </div>
              </div>
              <button onClick={() => setIsInsightsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors border-none bg-transparent cursor-pointer text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-slate-300 text-sm leading-relaxed">
              {isGeneratingInsights ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 size={32} className="animate-spin text-purple-500" />
                  <p className="text-slate-400">La IA está analizando las métricas de tu negocio...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {insightsText}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end shrink-0">
              <button 
                onClick={() => setIsInsightsOpen(false)}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors border-none cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
