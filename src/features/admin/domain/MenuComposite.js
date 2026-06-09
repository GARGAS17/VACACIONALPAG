// ====================================================================
// 🌳 PATRÓN COMPOSITE - Menú de Navegación Dinámico
// ====================================================================
// Permite que un "Item de Menú" sea un enlace simple (Leaf) o un
// "Desplegable" (Composite) que contenga otros enlaces, y que React 
// los renderice a ambos mediante un único método unificado.
// ====================================================================

// 1. COMPONENT (Interfaz base para cualquier elemento del menú)
export class MenuComponent {
  constructor(label, icon) {
    this.label = label;
    this.icon = icon;
  }
  
  // Devuelve la estructura plana o anidada lista para React
  renderData() { throw new Error('Debe implementarse'); }
}

// 2. LEAF (La Hoja - Un enlace de navegación normal)
export class MenuItem extends MenuComponent {
  constructor(label, icon, to) {
    super(label, icon);
    this.to = to;
  }

  renderData() {
    return {
      isGroup: false,
      label: this.label,
      icon: this.icon,
      to: this.to
    };
  }

  getFlatItems() {
    return [this.renderData()];
  }
}

// 3. COMPOSITE (El Grupo - Un menú desplegable que agrupa otros MenuComponents)
export class MenuGroup extends MenuComponent {
  constructor(label, icon) {
    super(label, icon);
    this.children = [];
  }

  add(menuComponent) {
    this.children.push(menuComponent);
    return this; // Permite encadenamiento fluido
  }

  // 🌟 MAGIA DEL COMPOSITE: Renderiza su info y pide a sus hijos que se rendericen
  renderData() {
    return {
      isGroup: true,
      label: this.label,
      icon: this.icon,
      children: this.children.map(child => child.renderData())
    };
  }

  getFlatItems() {
    return this.children.reduce((acc, child) => {
      return acc.concat(child.getFlatItems());
    }, []);
  }
}
