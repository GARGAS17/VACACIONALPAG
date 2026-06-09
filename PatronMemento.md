# Patrón Memento (Deshacer Edición de Cursos)

## 📌 Contexto
Al editar los detalles de un curso en el panel de administración (como el título, precio o capacidad), cualquier equivocación obligaba al administrador a volver a ingresar los datos previos de forma manual. No existía un historial local para recuperar el estado anterior del curso antes de presionar "Guardar".

## 🎯 ¿Qué se hizo exactamente?
Se implementó el **Patrón Memento** para permitir deshacer cambios (Undo):
1. **Originator (AdminCourses):** La vista administrativa crea mementos del estado del curso y los restaura cuando se solicita "Deshacer".
2. **Memento (CourseMemento):** Almacena una copia de seguridad profunda del objeto del curso.
3. **Caretaker (CourseCaretaker):** Guarda el historial de mementos y gestiona la pila de deshacer indexada por el ID del curso.

---

## 📂 Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Dominio (NUEVO)** | `src/features/admin/domain/CourseMemento.js` |
| **Consumidor UI** | `src/features/admin/pages/AdminCourses.jsx` |

---

## 💻 El Código (Antes vs Después)

### ❌ ANTES (Sin opción de deshacer)
Cualquier actualización en la base de datos sobrescribía los datos anteriores sin posibilidad de recuperación.

```javascript
/* src/features/admin/pages/AdminCourses.jsx */
const handleSave = async (e) => {
  // Guarda directamente en la base de datos...
  await supabase.from('courses').update(payload).eq('id', selectedCourse.id);
  // El estado anterior se perdió en memoria
}
```

### ✅ DESPUÉS (Historial con Memento)
Guardamos el estado previo del curso en la pila del cuidador (`caretaker`) antes de aplicar la actualización en la base de datos.

#### 1. Implementación del Memento y Caretaker
```javascript
/* src/features/admin/domain/CourseMemento.js */
export class CourseMemento {
  constructor(state) {
    // Copia profunda para aislar el estado original de cambios del front
    this.state = JSON.parse(JSON.stringify(state));
  }
  getState() { return this.state; }
}

export class CourseCaretaker {
  constructor() { this.mementos = {}; }

  save(courseId, courseState) {
    if (!this.mementos[courseId]) this.mementos[courseId] = [];
    this.mementos[courseId].push(new CourseMemento(courseState));
  }

  undo(courseId) {
    if (!this.mementos[courseId] || this.mementos[courseId].length === 0) return null;
    return this.mementos[courseId].pop().getState();
  }
  
  hasHistory(courseId) {
    return this.mementos[courseId] && this.mementos[courseId].length > 0;
  }
}
```

#### 2. Registro del Memento y Acción Deshacer en el Frontend
Al editar un curso o al transicionar su estado, se guarda el estado original:

```javascript
/* src/features/admin/pages/AdminCourses.jsx */
// Al guardar cambios en la edición
if (selectedCourse && selectedCourse.id) {
  // Memento: Salvamos estado previo
  caretakerRef.current.save(selectedCourse.id, selectedCourse);
  setHistoryCount(prev => prev + 1); // Fuerza renderizado para mostrar botón "Undo"
  
  await supabase.from('courses').update(payload).eq('id', selectedCourse.id);
}

// Handler de Deshacer (Undo)
const handleUndo = async (courseId) => {
  const previousState = caretakerRef.current.undo(courseId);
  if (!previousState) return;

  // Actualiza la base de datos con el estado anterior recuperado del Memento
  await supabase.from('courses').update(previousState).eq('id', courseId);
  
  // Sincroniza el estado local de React
  setCourses(prev => prev.map(c => c.id === courseId ? previousState : c));
};
```

---

## 🚀 Beneficios Alcanzados
- **Integridad de Datos:** Permite recuperar de forma segura y veloz un registro a su estado inmediatamente anterior.
- **Transparencia:** El Memento no expone los atributos internos del curso al caretaker, cumpliendo con el principio de encapsulamiento.
- **Experiencia de Usuario:** La interfaz muestra dinámicamente un botón en forma de flecha de retorno (`RotateCcw`) sólo cuando existen cambios guardados en el historial, brindando retroalimentación visual al usuario.
