# Patrón Composite (Estructuras Jerárquicas)

## Contexto
En la plataforma, teníamos estructuras que conceptualmente podían anidarse (como Menús de Navegación o Categorías de cursos), pero estaban programadas de forma "plana" y rígida. Por ejemplo, el menú lateral era simplemente un *array* de objetos estáticos. Si queríamos hacer un menú desplegable (un menú dentro de otro menú), la lógica de renderizado en React se iba a romper o se llenaría de sentencias `if`.

## ¿Qué se hizo exactamente?
Se implementó el **Patrón Composite**, el cual permite agrupar objetos en estructuras de árbol. La maravilla de este patrón es que permite a la aplicación (React) tratar a los elementos individuales (un link) y a las composiciones (un grupo de links) **de manera exactamente idéntica**.

---

## Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Patrón (NUEVO)** | `src/patterns/MenuComposite.js` |
| **Patrón (NUEVO)** | `src/patterns/CategoryComposite.js` |
| **Capa de Lógica UI** | `src/layouts/uiFactory.jsx` |
| **Consumidor UI** | `src/pages/Catalog.jsx` |
| **Base de Datos** | `supabase/schema_v2_OPTIMIZADO.sql` (Añadido `parent_id`) |

---

## El Código (Menú Dinámico)

### ANTES (Array Plano)
```javascript
/* src/layouts/uiFactory.jsx */
getSidebarItems() {
  return [
    { to: '/dashboard/inicio', label: 'Inicio' },
    { to: '/dashboard/cursos', label: 'Cursos' },
    { to: '/dashboard/perfil', label: 'Mi Perfil' } // ¿Cómo agrupo esto bajo "Configuración"?
  ];
}
```

### DESPUÉS (Árbol Compuesto)

#### 1. Las Clases del Patrón
```javascript
/* src/patterns/MenuComposite.js */

// Componente individual (Leaf)
export class MenuItem extends MenuComponent {
  renderData() { return { isGroup: false, label: this.label, to: this.to }; }
}

// Agrupador (Composite)
export class MenuGroup extends MenuComponent {
  constructor(...) { this.children = []; }
  
  add(component) { this.children.push(component); return this; }
  
  renderData() {
    return {
      isGroup: true,
      label: this.label,
      children: this.children.map(c => c.renderData()) // Llama recursivamente a los hijos
    };
  }
}
```

#### 2. La Construcción
```javascript
/* src/layouts/uiFactory.jsx */
const rootMenu = new MenuGroup('Menú Principal', null);

rootMenu.add(new MenuItem('Inicio', Home, '/dashboard/inicio'));

const settingsGroup = new MenuGroup('Configuración', Settings);
settingsGroup.add(new MenuItem('Mi Perfil', User, '/dashboard/perfil'));

rootMenu.add(settingsGroup); // Anidación perfecta
```

#### 3. El Renderizado (React ya no necesita saber qué tan profundo es el menú)
```javascript
/* src/pages/Catalog.jsx */
const renderNode = (node) => {
  if (node.isGroup) {
    // Si es compuesto, pinta el título y se llama a sí mismo para pintar sus hijos
    return (
      <div className="menu-group">
        <h4>{node.label}</h4>
        <ul>{node.children.map(renderNode)}</ul>
      </div>
    );
  } else {
    // Si es hoja, pinta el enlace simple
    return <li><a href={node.to}>{node.label}</a></li>;
  }
};
```

## Beneficios Alcanzados
- **Recursividad Elegante:** La barra lateral de la plataforma ahora soporta sub-menús infinitos sin tocar el código de `Catalog.jsx`.
- **Estandarización de Base de Datos:** Las categorías ahora soportan Sub-Categorías nativamente gracias a que el esquema SQL ahora implementa recursividad con la columna `parent_id`.
