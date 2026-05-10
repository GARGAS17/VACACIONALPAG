// ====================================================================
// 🍃 PATRÓN FLYWEIGHT - Optimización de Memoria (RAM)
// ====================================================================
// Evita que se creen miles de copias de los mismos objetos "Profesor"
// y "Categoría" al parsear respuestas JSON gigantes desde Supabase.
// ====================================================================

export class EntityFlyweightFactory {
  // Los "Pools" (Estado Intrínseco compartido)
  private static professors = new Map<string, any>();
  private static categories = new Map<string, any>();

  /**
   * Devuelve SIEMPRE la misma referencia de memoria para un profesor dado.
   */
  static getProfessor(professorData: any) {
    if (!professorData) return null;
    
    // La clave principal es el ID. Usamos el nombre como fallback.
    const key = professorData.id || professorData.name || 'unknown_prof';
    
    if (!this.professors.has(key)) {
      // Si no existe en el pool, se instancia UNA sola vez
      this.professors.set(key, { ...professorData });
    }
    
    // Devuelve el puntero a la memoria compartida
    return this.professors.get(key);
  }

  /**
   * Devuelve SIEMPRE la misma referencia de memoria para una categoría.
   */
  static getCategory(categoryData: any) {
    if (!categoryData) return null;
    
    const key = categoryData.id || categoryData.name || 'unknown_cat';
    
    if (!this.categories.has(key)) {
      this.categories.set(key, { ...categoryData });
    }
    
    return this.categories.get(key);
  }
  
  /**
   * Limpia los pools. Útil para forzar liberación de RAM si cambiamos de vista o sesión.
   */
  static clearPools() {
    this.professors.clear();
    this.categories.clear();
    console.log("🍃 [FLYWEIGHT] Pools de memoria liberados.");
  }
}
