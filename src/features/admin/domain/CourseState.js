// ====================================================================
// 🔄 PATRÓN STATE - Ciclo de Vida de los Cursos
// ====================================================================
// Controla el comportamiento de un curso basado en su estado actual:
// Borrador (Draft), Publicado (Published) y Archivado (Archived).
// Controla qué transiciones de estado son válidas en la aplicación.
// ====================================================================

export class CourseState {
  constructor(name) {
    this.name = name; // 'draft', 'published', 'archived'
  }

  publish(context) {
    throw new Error(`Transición no permitida: No se puede publicar desde el estado "${this.name}".`);
  }

  archive(context) {
    throw new Error(`Transición no permitida: No se puede archivar desde el estado "${this.name}".`);
  }

  draft(context) {
    throw new Error(`Transición no permitida: No se puede regresar a borrador desde el estado "${this.name}".`);
  }
}

// 1. ESTADO BORRADOR (DraftState)
export class DraftState extends CourseState {
  constructor() {
    super('draft');
  }

  publish(context) {
    context.setState(new PublishedState());
  }

  archive(context) {
    context.setState(new ArchivedState());
  }
}

// 2. ESTADO PUBLICADO (PublishedState)
export class PublishedState extends CourseState {
  constructor() {
    super('published');
  }

  draft(context) {
    context.setState(new DraftState());
  }

  archive(context) {
    context.setState(new ArchivedState());
  }
}

// 3. ESTADO ARCHIVADO (ArchivedState)
export class ArchivedState extends CourseState {
  constructor() {
    super('archived');
  }

  draft(context) {
    context.setState(new DraftState());
  }
}

// CONTEXTO (CourseContext)
export class CourseContext {
  constructor(initialStateName) {
    this.state = this.getStateInstance(initialStateName);
  }

  getStateInstance(name) {
    switch (name) {
      case 'published':
        return new PublishedState();
      case 'archived':
        return new ArchivedState();
      case 'draft':
      default:
        return new DraftState();
    }
  }

  setState(state) {
    this.state = state;
  }

  publish() {
    this.state.publish(this);
    return this.state.name;
  }

  archive() {
    this.state.archive(this);
    return this.state.name;
  }

  draft() {
    this.state.draft(this);
    return this.state.name;
  }

  getStateName() {
    return this.state.name;
  }
}
