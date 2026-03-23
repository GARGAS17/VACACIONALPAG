// === 🛠️ PATRÓN BUILDER (Constructor de Consultas) ===

export class CourseQueryBuilder {
  constructor(courses = []) {
    this.courses = courses;
  }

  // 1. Excluir cursos ya pagados que no hayan expirado
  excludePaid(paidIds = []) {
    if (paidIds.length > 0) {
      this.courses = this.courses.filter(course => {
         const isPaid = paidIds.includes(course.id);
         const hasEnded = course.end_date ? new Date(course.end_date) < new Date() : false;
         return !(isPaid && !hasEnded); // Retornamos true para conservar curso
      });
    }
    return this; 
  }

  // 2. Filtrar por búsqueda de texto (Título)
  withSearch(query = '') {
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase();
      this.courses = this.courses.filter(course => 
        course.title.toLowerCase().includes(lowerQuery) ||
        course.professors?.name?.toLowerCase().includes(lowerQuery)
      );
    }
    return this;
  }

  // 3. Filtrar por horarios (Mañana / Tarde / Noche)
  withSchedule(filterType = 'Todos') {
    if (filterType === 'Mañana') {
      this.courses = this.courses.filter(course => course.start_time?.startsWith('0')); // Horas 06:00 - 11:59
    } else if (filterType === 'Tarde') {
      this.courses = this.courses.filter(course => course.start_time?.startsWith('1') && parseInt(course.start_time.split(':')[0]) < 18); // 12:00 - 17:59
    } else if (filterType === 'Noche') {
      this.courses = this.courses.filter(course => {
        const hour = parseInt(course.start_time?.split(':')[0] || '0');
        return hour >= 18 || hour < 6; // 18:00 en adelante
      });
    }
    return this;
  }

  // 4. Filtrar cupos disponibles
  onlyAvailable(flag = false) {
    if (flag) {
      this.courses = this.courses.filter(course => 
        (course.capacity - course.enrolled_count) > 0
      );
    }
    return this;
  }

  // 5. Devolver el array final de cursos
  build() {
    return this.courses;
  }
}
