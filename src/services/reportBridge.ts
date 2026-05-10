// ====================================================================
// 🌉 PATRÓN BRIDGE - Sistema de Exportación de Reportes
// ====================================================================
// El Bridge separa "El Formato" (Implementación) 
// de "El Tipo de Reporte" (Abstracción).
// ====================================================================

// ──────────────────────────────────────────────────────────
// 1. LA IMPLEMENTACIÓN (Los Formateadores - El "Cómo")
// ──────────────────────────────────────────────────────────
export interface IReportFormatter {
  formatData(data: Record<string, any>[]): string;
  getFileExtension(): string;
  getMimeType(): string;
}

export class CSVFormatter implements IReportFormatter {
  formatData(data: Record<string, any>[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  getFileExtension(): string { return 'csv'; }
  getMimeType(): string { return 'text/csv'; }
}

export class JSONFormatter implements IReportFormatter {
  formatData(data: Record<string, any>[]): string {
    return JSON.stringify(data, null, 2);
  }

  getFileExtension(): string { return 'json'; }
  getMimeType(): string { return 'application/json'; }
}

// ──────────────────────────────────────────────────────────
// 2. LA ABSTRACCIÓN (Los Reportes - El "Qué")
// ──────────────────────────────────────────────────────────
export abstract class ReportAbstraction {
  protected formatter: IReportFormatter; // ⬅️ EL PUENTE

  constructor(formatter: IReportFormatter) {
    this.formatter = formatter;
  }

  // Permite cambiar el formateador dinámicamente en tiempo de ejecución
  setFormatter(formatter: IReportFormatter) {
    this.formatter = formatter;
  }

  // Cada reporte define cómo prepara sus datos específicos
  abstract prepareData(rawData: any): Record<string, any>[];

  // Método centralizado para exportar (Template Method ligero)
  export(filename: string, rawData: any) {
    const dataToFormat = this.prepareData(rawData);
    const formattedString = this.formatter.formatData(dataToFormat);
    
    // Lógica pura de navegador para descargar
    const blob = new Blob([formattedString], { type: this.formatter.getMimeType() });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${this.formatter.getFileExtension()}`;
    document.body.appendChild(a); // Requerido en algunos navegadores
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ──────────────────────────────────────────────────────────
// 3. ABSTRACCIONES REFINADAS (Tipos de reportes concretos)
// ──────────────────────────────────────────────────────────
export class DashboardMetricsReport extends ReportAbstraction {
  prepareData(metrics: any): Record<string, any>[] {
    // Transforma el objeto de métricas en un formato tabular simple
    return [
      { Métrica: 'Ingresos Totales', Valor: `$${metrics?.totalRevenue?.toFixed(2) ?? 0}` },
      { Métrica: 'Inscripciones Totales', Valor: metrics?.totalEnrollments ?? 0 },
      { Métrica: 'Cursos Totales', Valor: metrics?.totalCourses ?? 0 },
      { Métrica: 'Cursos Publicados', Valor: metrics?.publishedCourses ?? 0 },
      { Métrica: 'Ocupación (%)', Valor: `${metrics?.occupancyPercent ?? 0}%` },
      { Métrica: 'Curso Más Popular', Valor: metrics?.topCourse?.title ?? 'N/A' },
      { Métrica: 'Estudiantes en Curso Top', Valor: metrics?.topCourse?.enrolled_count ?? 0 }
    ];
  }
}

export class CoursesListReport extends ReportAbstraction {
  prepareData(courses: any[]): Record<string, any>[] {
    // Supongamos que recibe una lista de cursos, la mapea a tabla
    return courses.map(c => ({
      ID: c.id,
      Título: c.title,
      Estado: c.status,
      Precio: `$${c.price}`,
      Inscritos: c.enrolled_count
    }));
  }
}
