# Patrón State (Ciclo de Vida del Curso)

## 📌 Contexto
En el flujo de administración de cursos, el estado de un curso (Borrador, Publicado, Archivado) gobernaba lógicas condicionales. Originalmente, el estado del curso se alternaba de manera binaria (Borrador <-> Publicado) mediante un interruptor, sin restringir las transiciones de forma lógica ni validar si se permitían estados más complejos como "Archivado".

## 🎯 ¿Qué se hizo exactamente?
Se implementó el **Patrón State** para modelar el ciclo de vida del curso de forma orientada a objetos:
1. **Context (CourseContext):** Mantiene una referencia al estado actual y expone métodos de transición (`publish`, `archive`, `draft`).
2. **State Base (CourseState):** Clase abstracta que define las firmas de las transiciones lanzando errores por defecto si la transición no es válida.
3. **Concrete States:** `DraftState` (puede publicar o archivar), `PublishedState` (puede despublicar o archivar) y `ArchivedState` (solo puede restaurar a borrador; no se puede publicar directamente).

---

## 📂 Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Dominio (NUEVO)** | `src/features/admin/domain/CourseState.js` |
| **Consumidor UI** | `src/features/admin/pages/AdminCourses.jsx` |

---

## 💻 El Código (Antes vs Después)

### ❌ ANTES (Lógica de control mediante strings)
El frontend hacía transiciones manuales y lógicas de alternancia simples, propensas a errores al ingresar más estados.

```javascript
/* src/features/admin/pages/AdminCourses.jsx */
const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', id);
  // No hay control de transiciones si existieran más estados como 'archived'
}
```

### ✅ DESPUÉS (Lógica encapsulada en clases de Estado)
Creamos clases de estado concretas que controlan qué acciones son válidas para cada estado del curso.

#### 1. Implementación del Patrón State
```javascript
/* src/features/admin/domain/CourseState.js */
export class CourseState {
  constructor(name) { this.name = name; }
  publish(context) { throw new Error("Acción no permitida"); }
  archive(context) { throw new Error("Acción no permitida"); }
  draft(context) { throw new Error("Acción no permitida"); }
}

export class DraftState extends CourseState {
  constructor() { super('draft'); }
  publish(context) { context.setState(new PublishedState()); }
  archive(context) { context.setState(new ArchivedState()); }
}

export class ArchivedState extends CourseState {
  constructor() { super('archived'); }
  draft(context) { context.setState(new DraftState()); }
  // Notar que no implementa publish(), bloqueando la publicación directa
}
```

#### 2. Consumo en la UI (AdminCourses)
El frontend inicializa el contexto con el estado actual del curso y ejecuta la transición. Si esta no es válida, la UI captura el error y alerta al usuario.

```javascript
/* src/features/admin/pages/AdminCourses.jsx */
const handleTransitionStatus = async (course, targetStatus) => {
  const context = new CourseContext(course.status);
  try {
    let nextStatus;
    if (targetStatus === 'published') nextStatus = context.publish();
    else if (targetStatus === 'archived') nextStatus = context.archive();
    else if (targetStatus === 'draft') nextStatus = context.draft();

    // Actualiza base de datos con el nuevo estado validado
    await supabase.from('courses').update({ status: nextStatus }).eq('id', course.id);
  } catch (err) {
    // Si la transición falla (ej. archived -> published), se muestra el error de State
    addToast({ message: err.message, type: 'error' });
  }
};
```

---

## 🚀 Beneficios Alcanzados
- **Eliminación de Condicionales Bifurcados:** No hay bloques `if/else` gigantescos validando qué estados permiten qué operaciones.
- **Robustez y Seguridad:** El estado final se determina mediante reglas de dominio puras en la carpeta de dominio.
- **Enfoque de UI Guiado:** La interfaz oculta o deshabilita botones que corresponden a transiciones inválidas para el estado actual.
