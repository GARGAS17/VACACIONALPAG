# 🌉 Patrón Bridge (Sistema de Exportación de Reportes)

## 📖 Referencia Teórica
[Refactoring Guru: Patrón Bridge](https://refactoring.guru/es/design-patterns/bridge)

> **Propósito Técnico:** El patrón Bridge es un patrón estructural que divide la lógica de negocio o una clase muy grande en dos jerarquías separadas (Abstracción e Implementación) que pueden desarrollarse de forma independiente.

## 📌 Contexto en el Proyecto
El componente de React `AdminDashboard.jsx` era responsable de generar un CSV hardcodeado concatenando strings y manipulando el objeto global `URL` y `Blob` del navegador. 

**Code Smell:** Si se requería agregar soporte para exportar en JSON o PDF, y a su vez generar reportes distintos (ej. "Reporte de Cursos" en lugar de "Reporte del Dashboard"), la UI se llenaría de cláusulas `if/else`, violando el *Single Responsibility Principle* y creando una explosión combinatoria.

## 📂 Archivos Involucrados
| Responsabilidad | Archivo(s) | Ruta |
| --- | --- | --- |
| **Abstracción & Implementación** | `reportBridge.ts` | `src/services/reportBridge.ts` |
| **Cliente / UI** | `AdminDashboard.jsx` | `src/pages/admin/AdminDashboard.jsx` |

---

## 💻 El Código (Explicación Arquitectónica)

### 1. La Implementación (El "Cómo" se exporta)
Extraemos la lógica de manipulación de formatos a clases dedicadas que cumplen una interfaz común.

```typescript
// src/services/reportBridge.ts
export interface IReportFormatter {
  formatData(data: Record<string, any>[]): string;
  getFileExtension(): string;
  getMimeType(): string;
}

export class CSVFormatter implements IReportFormatter {
  formatData(data) { /* Construye strings separadas por coma */ }
  // ... métodos de extensión
}

export class JSONFormatter implements IReportFormatter {
  formatData(data) { return JSON.stringify(data, null, 2); }
  // ... métodos de extensión
}
```

### 2. La Abstracción (El "Qué" se reporta)
Contiene una referencia al puente (`formatter: IReportFormatter`) hacia la jerarquía de implementación y delega en ella el trabajo de formateo.

```typescript
export abstract class ReportAbstraction {
  protected formatter: IReportFormatter; // ⬅️ EL PUENTE

  constructor(formatter: IReportFormatter) {
    this.formatter = formatter;
  }

  abstract prepareData(rawData: any): Record<string, any>[];

  // Template method que delega el formato a la implementación inyectada
  export(filename: string, rawData: any) {
    const dataToFormat = this.prepareData(rawData);
    const formattedString = this.formatter.formatData(dataToFormat);
    
    // Lógica de descarga nativa del navegador...
  }
}

// Abstracción Refinada (Subclase)
export class DashboardMetricsReport extends ReportAbstraction {
  prepareData(metrics: any) {
    return [
      { Métrica: 'Ingresos Totales', Valor: metrics.totalRevenue },
      // ... mapeo de datos específico
    ];
  }
}
```

### 3. El Cliente (El Componente React)
La vista pasa a ser ignorante de los detalles de formato. Ensambla el puente y ejecuta.

```jsx
// src/pages/admin/AdminDashboard.jsx
const handleExport = () => {
  // Ensamblaje dinámico
  const formatter = exportFormat === 'csv' ? new CSVFormatter() : new JSONFormatter();
  const report = new DashboardMetricsReport(formatter); // Cruzamos el puente
  
  report.export('reporte-admin-dashboard', metrics);
};
```

## 🚀 Beneficios
1. **Open/Closed Principle:** Puedes agregar exportación en PDF (`PDFFormatter`) sin tocar el código de `DashboardMetricsReport`.
2. **Desacoplamiento Front-end:** `AdminDashboard.jsx` ya no maneja lógica pura de strings ni `Blob` creation, reduciendo el tamaño del componente y haciendo la lógica testeable en un entorno de pruebas sin interfaz gráfica.
