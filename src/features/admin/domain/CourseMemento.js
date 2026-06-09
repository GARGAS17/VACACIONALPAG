// ====================================================================
// 💾 PATRÓN MEMENTO - Historial de Edición
// ====================================================================
// Permite guardar y restaurar el estado previo de un curso durante
// la edición en el panel de control, permitiendo realizar "Deshacer" (Undo)
// sin exponer los detalles internos del objeto del curso.
// ====================================================================

export class CourseMemento {
  constructor(state) {
    // Realizamos una copia profunda para asegurar que no haya referencias compartidas
    this.state = JSON.parse(JSON.stringify(state));
  }

  getState() {
    return this.state;
  }
}

export class CourseCaretaker {
  constructor() {
    this.mementos = {}; // Mapa de courseId -> Array de mementos
  }

  // Guarda una copia del estado del curso
  save(courseId, courseState) {
    if (!courseId) return;
    if (!this.mementos[courseId]) {
      this.mementos[courseId] = [];
    }
    // Limitamos el historial a las últimas 5 ediciones para optimizar memoria
    if (this.mementos[courseId].length >= 5) {
      this.mementos[courseId].shift();
    }
    this.mementos[courseId].push(new CourseMemento(courseState));
  }

  // Obtiene el último memento y lo remueve del historial
  undo(courseId) {
    if (!courseId || !this.mementos[courseId] || this.mementos[courseId].length === 0) {
      return null;
    }
    const memento = this.mementos[courseId].pop();
    return memento.getState();
  }

  // Verifica si hay historial disponible para deshacer
  hasHistory(courseId) {
    return !!(courseId && this.mementos[courseId] && this.mementos[courseId].length > 0);
  }

  // Limpia el historial de un curso específico
  clear(courseId) {
    if (courseId && this.mementos[courseId]) {
      delete this.mementos[courseId];
    }
  }
}
