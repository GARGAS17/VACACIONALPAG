// ====================================================================
// 🌳 PATRÓN COMPOSITE - Categorías Anidadas (Subcategorías)
// ====================================================================
// Permite tratar de forma uniforme a una categoría hoja (ej. "React") 
// y a una categoría padre (ej. "Desarrollo Web") que contiene hijas.
// ====================================================================

// 1. COMPONENT (Interfaz común)
export class CategoryComponent {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
  
  // Sumará los cursos propios o de todos los hijos recursivamente
  getCoursesCount() { throw new Error('Debe implementarse'); }
}

// 2. LEAF (La Hoja - Categoría final que tiene cursos directamente)
export class CategoryLeaf extends CategoryComponent {
  constructor(id, name, coursesCount = 0) {
    super(id, name);
    this.coursesCount = coursesCount;
  }

  getCoursesCount() {
    return this.coursesCount;
  }
}

// 3. COMPOSITE (El Grupo - Categoría que contiene otras categorías)
export class CategoryComposite extends CategoryComponent {
  constructor(id, name) {
    super(id, name);
    this.children = [];
  }

  add(component) {
    this.children.push(component);
    return this; // Para encadenar: root.add(c1).add(c2)
  }

  remove(id) {
    this.children = this.children.filter(c => c.id !== id);
  }

  // 🌟 MAGIA DEL COMPOSITE: 
  // Pides el conteo al padre, y él recolecta recursivamente la suma de sus hijos.
  getCoursesCount() {
    return this.children.reduce((total, child) => total + child.getCoursesCount(), 0);
  }
}

// --- EJEMPLO DE USO PRÁCTICO ---
// const root = new CategoryComposite('root', 'Todas las Categorías');
// const dev = new CategoryComposite('dev', 'Programación');
// const design = new CategoryComposite('design', 'Diseño');
// 
// const react = new CategoryLeaf('react', 'React JS', 15);
// const node = new CategoryLeaf('node', 'Node JS', 10);
// const figma = new CategoryLeaf('figma', 'Figma UX', 5);
//
// dev.add(react).add(node);
// design.add(figma);
// root.add(dev).add(design);
//
// console.log(root.getCoursesCount()); // Devolverá 30 automáticamente sin bucles complejos.
