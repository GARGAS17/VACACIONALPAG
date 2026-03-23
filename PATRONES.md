# 🧠 Documentación de Patrones de Diseño Implementados

Este documento detalla los patrones de diseño aplicados en el proyecto, su funcionamiento **Antes vs Después**, y los pasos exactos para revertir los cambios si deseas volver al código tradicional.

---

## 🏭 1. Factory Method (Método Fábrica)
* **Ubicación**: `src/services/paymentFactory.js` e integrado en `src/pages/Catalog.jsx`
* **Objetivo**: Centralizar y aislar la creación de diferentes procesadores de pago (Stripe, Manual, etc.).

### 🔴 Antes (Sin el patrón):
En `Catalog.jsx`, la suscripción o pago llamaba directamente a una función fija de Supabase:
```javascript
const handleEnroll = async (courseId) => {
  setEnrolling(true);
  const { data, error } = await supabase.functions.invoke('enroll', { body: { courseId } });
  if (data?.url) window.location.assign(data.url);
};
```

### 🟢 Ahora (Con el patrón):
Se delega la lógica a un "Gestor de Fábrica":
```javascript
const processor = PaymentFactory.getProcessor(paymentMethod); // Devuelve Stripe, PayPal o Manual
const { url } = await processor.checkout({ courseId, userId });
if (url) window.location.assign(url);
```

### ↩️ Pasos para Revertir:
1. ve a `src/pages/Catalog.jsx`.
2. Busca la función `handleEnroll` (Aprox línea 70).
3. **Borra** el bloque `try/catch` de la Factory y **pega** el código tradicional:
   ```javascript
   const handleEnroll = async (courseId) => {
     setEnrolling(true);
     const { data, error } = await supabase.functions.invoke('enroll', { body: { courseId, userId: user.id } });
     setEnrolling(false);
     if (data?.url) window.location.assign(data.url);
   };
   ```
4. Borra el archivo `src/services/paymentFactory.js`.

---

## 🏛️ 2. Abstract Factory (Fábrica Abstracta)
* **Ubicación**: `src/layouts/uiFactory.jsx` e integrado en `Catalog.jsx`
* **Objetivo**: Generar familias de componentes de interfaz (como el Sidebar) basados en roles.

### 🔴 Antes (Sin el patrón):
El menú lateral generaba los enlaces escribiéndolos uno por uno estáticamente en el HTML de la vista:
```javascript
<ul>
  <li onClick={() => navigate('/dashboard/inicio')}><Home /> Inicio</li>
  <li onClick={() => navigate('/dashboard/cursos')}><BookOpen /> Cursos</li>
</ul>
```

### 🟢 Ahora (Con el patrón):
El patrón decide qué menú dibujar (Estudiante o Administrador) y devuelve el listado:
```javascript
const factory = UIFactoryProvider.getFactory('student', profile);
const navItems = factory.getSidebarItems(); // Extrae la familia de links
```

### ↩️ Pasos para Revertir:
1. Ve a `src/pages/Catalog.jsx`.
2. Busca el sub-componente `const Sidebar = () ...` (Aprox línea 106).
3. **Borra** el bucle `.map()` del Factory y **pega** de nuevo los botones estáticos:
   ```javascript
    const Sidebar = () => (
      <div className="navigation">
        <ul>
          <li onClick={() => navigate('/dashboard/inicio')}><Home /> Inicio</li>
          <li onClick={() => navigate('/dashboard/cursos')}><BookOpen /> Cursos</li>
          {/* ... Repetir para perfil, pagos, etc ... */}
        </ul>
      </div>
    );
   ```
4. Borra el archivo `src/layouts/uiFactory.jsx`.

---

## 🛠️ 3. Builder (Constructor de Consultas)
* **Ubicación**: `src/services/courseQueryBuilder.js` e integrado en `Catalog.jsx`
* **Objetivo**: Limpiar el código que hace múltiples filtros sobre los cursos.

### 🔴 Antes (Sin el patrón):
Se acumulaban cadenas lógicas `if-return` difíciles de escalar:
```javascript
const filteredCourses = courses.filter(course => {
  if (paidIds.includes(course.id)) return false;
  if (filter === 'Mañana' && !course.start_time.startsWith('0')) return false;
  return true;
});
```

### 🟢 Ahora (Con el patrón):
Se encadenan los filtros de forma legible como una oración:
```javascript
const filteredCourses = new CourseQueryBuilder(courses)
  .excludePaid(paidCourseIds)
  .withSearch(searchQuery)
  .withSchedule(filter)
  .build();
```

### ↩️ Pasos para Revertir:
1. Ve a `src/pages/Catalog.jsx`.
2. Busca la variable `const filteredCourses` (Aprox línea 90).
3. **Borra** la inicialización de `CourseQueryBuilder` y **pega** el filtro manual:
   ```javascript
   const filteredCourses = courses.filter(course => {
     if (paidCourseIds.includes(course.id)) return false;
     if (searchQuery && !course.title.includes(searchQuery)) return false;
     return true;
   });
   ```
4. Borra el archivo `src/services/courseQueryBuilder.js`.

---

## 📋 4. Prototype (Prototipado / Clonación)
* **Ubicación**: `src/pages/admin/AdminCourses.jsx`
* **Objetivo**: Duplicar un Curso para agilizar la productividad del panel.

### 🔴 Antes (Sin el patrón):
No existía la función para clonar. Un administrador debía abrir el modal "Nuevo Curso" y diligenciar todo de cero.

### 🟢 Ahora (Con el patrón):
Se clonan las propiedades de un curso pre-existente, removiendo los IDs primarios:
```javascript
const handleCloneCourse = (course) => {
  const clonedCourse = { ...course, id: undefined, title: `${course.title} (Copia)` };
  openModal(clonedCourse);
};
```

### ↩️ Pasos para Revertir:
1. Ve a `src/pages/admin/AdminCourses.jsx`.
2. Busca y **borra** la función `handleCloneCourse` (Aprox línea 211).
3. Baja hasta la tabla de renderizado (Aprox línea 340).
4. **Elimina el botón** HTML que llama a la clonación:
   ```html
   <button onClick={() => handleCloneCourse(course)}> <Copy /> </button>
   ```

---
*Fin del documento de patrones.*
