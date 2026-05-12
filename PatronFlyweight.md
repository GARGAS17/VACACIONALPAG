# 🍃 Patrón Flyweight (Peso Ligero y Optimización de RAM)

## 📖 Referencia Teórica
[Refactoring Guru: Patrón Flyweight](https://refactoring.guru/es/design-patterns/flyweight)

> **Propósito Técnico:** Flyweight es un patrón de diseño estructural que te permite mantener a raya el consumo de RAM compartiendo partes comunes del estado (estado intrínseco) entre múltiples objetos en lugar de mantener todos los datos en cada objeto.

## 📌 Contexto en el Proyecto
El componente de React `Catalog.jsx` descargaba datos de los cursos de Supabase, los cuales incluían objetos JSON anidados para las relaciones (ej. `professors: { id: "123", name: "Prof. Sánchez" }`).
Si la API devolvía 10,000 cursos dictados por apenas 10 profesores distintos, la capa de red y JavaScript creaban **10,000 objetos distintos en la memoria RAM** para esos profesores, saturando el *Garbage Collector* e incrementando severamente la lentitud del "Virtual DOM diffing" en React.

## 📂 Archivos Involucrados
| Responsabilidad | Archivo(s) | Ruta |
| --- | --- | --- |
| **La Fábrica / Pool** | `EntityFlyweightFactory.ts` | `src/patterns/flyweight/...` |
| **El Consumidor** | `Catalog.jsx` | `src/pages/Catalog.jsx` |

---

## 💻 El Código (Explicación Arquitectónica)

### 1. La Fábrica del Flyweight (Control del Pool)
Un gestor que almacena las referencias únicas a los objetos. Si un objeto con las mismas características ya existe, se devuelve su puntero.

```typescript
// src/patterns/flyweight/EntityFlyweightFactory.ts
export class EntityFlyweightFactory {
  // Los pools en memoria (estado intrínseco compartido)
  private static professors = new Map<string, any>();
  private static categories = new Map<string, any>();

  static getProfessor(professorData: any) {
    if (!professorData) return null;
    
    // Identificador único del profesor
    const key = professorData.id || professorData.name || 'unknown_prof';
    
    if (!this.professors.has(key)) {
      // Guardar el objeto crudo SOLO una vez
      this.professors.set(key, { ...professorData });
    }
    
    // Retorna la MISMA referencia de memoria (puntero)
    return this.professors.get(key);
  }
  
  static getCategory(categoryData: any) {
    // ... misma lógica para categorías
  }
}
```

### 2. Implementación en la Consulta (Normalización Frontend)
Interceptamos la data cruda del JSON y reemplazamos los objetos profundos generados por el motor v8 (JavaScript) por las referencias centralizadas del *Factory*.

```javascript
// src/pages/Catalog.jsx (Fragmento de TanStack Query)
queryFn: async () => {
  const { data, error } = await supabase.from('courses').select('*, categories(id, name), professors(id, name)');
  
  // 🍃 PATRÓN FLYWEIGHT: Normalización y mapeo en memoria
  const optimizedCourses = (data || []).map(course => ({
    ...course,
    professors: EntityFlyweightFactory.getProfessor(course.professors),
    categories: EntityFlyweightFactory.getCategory(course.categories)
  }));
  
  return optimizedCourses; // Entidades ultra ligeras en memoria compartida
}
```

## 🚀 Beneficios
1. **Reducción Inmensa de Huella de Memoria (RAM):** Disminuye de $O(N)$ a $O(K)$ el número de instancias repetitivas (donde $N$ es cursos totales y $K$ profesores/categorías únicas).
2. **Shallow Compare Instantáneo en React:** Como ahora `courseA.professors` y `courseB.professors` (si los dicta el mismo profesor) son **exactamente el mismo objeto en memoria** (`===` da `true`), componentes inyectados con `React.memo` se re-renderizarán instantáneamente sin tener que analizar profundamente (deep-diff) el árbol JSON.
