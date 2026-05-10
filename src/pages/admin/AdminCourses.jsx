import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import { Plus, Search, Pencil, Trash2, AlertTriangle, Users, DollarSign, Image, Upload, Copy } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

const statusColors = {
  published: 'bg-green-500/15 text-green-400',
  draft: 'bg-yellow-500/15 text-yellow-400',
  archived: 'bg-slate-500/15 text-slate-400',
};

const statusLabels = {
  published: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado',
};

export const AdminCourses = () => {
  const addToast = useNotificationStore((state) => state.addToast);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', category_id: '', professor_id: '',
    price: 0, capacity: 20, start_date: '', end_date: '',
    start_time: '', end_time: '', days_of_week: '',
    schedule: '', location: 'Online', room_number: '', status: 'draft',
    thumbnail_url: ''
  });

  const fileInputRef = useRef(null);

  const fetchAuxData = async () => {
    try {
      const { data: catData } = await supabase.from('categories').select('id, name').order('name');
      const { data: profData } = await supabase.from('professors').select('id, name').eq('is_active', true).order('name');
      setCategories(catData || []);
      setProfessors(profData || []);
    } catch (err) {
      console.error('Error aux data', err);
    }
  };

  const openModal = (course = null) => {
    setSelectedCourse(course);
    setFormData({
      title: course?.title || '',
      description: course?.description || '',
      category_id: course?.category_id || '',
      professor_id: course?.professor_id || '',
      price: course?.price || 0,
      capacity: course?.capacity || 20,
      start_date: course?.start_date || '',
      end_date: course?.end_date || '',
      start_time: course?.start_time || '',
      end_time: course?.end_time || '',
      days_of_week: course?.days_of_week || '',
      schedule: course?.schedule || '',
      location: course?.location || 'Online',
      room_number: course?.room_number || '',
      status: course?.status || 'draft',
      thumbnail_url: course?.thumbnail_url || ''
    });
    setIsModalOpen(true);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCourse ? selectedCourse.id : 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      addToast({ message: 'Carga exitosa', type: 'success' });
    } catch (err) {
      addToast({ message: 'Error al subir imagen: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.days_of_week ? prev.days_of_week.split(', ') : [];
      const newDays = days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day];
      return { ...prev, days_of_week: newDays.join(', ') };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || '',
        category_id: formData.category_id,
        professor_id: formData.professor_id,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        days_of_week: formData.days_of_week,
        schedule: formData.schedule || '',
        location: formData.location || 'Online',
        room_number: formData.room_number || null,
        status: formData.status,
        thumbnail_url: formData.thumbnail_url || null
      };

      if (selectedCourse && selectedCourse.id) {
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', selectedCourse.id);
        if (error) throw error;
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, ...payload, professors: professors.find(p => p.id === formData.professor_id) } : c));
        addToast({ message: 'Curso actualizado', type: 'success' });
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert(payload)
          .select(`*, professors(id, name)`)
          .single();
        if (error) throw error;
        setCourses(prev => [data, ...prev]);
        addToast({ message: 'Curso creado', type: 'success' });
      }
      setIsModalOpen(false);
    } catch (err) {
      addToast({ message: 'Error al guardar: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          professors (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      addToast({ message: 'Error cargando cursos', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchAuxData();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    setIsToggling(id);
    try {
      const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      setCourses(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      addToast({ message: `Curso ${newStatus === 'published' ? 'publicado' : 'ocultado'} exitosamente`, type: 'success' });
    } catch (err) {
      addToast({ message: 'Error al cambiar el estado', type: 'error' });
    } finally {
      setIsToggling(null);
    }
  };

  // === 📋 USO DEL PATRÓN PROTOTYPE (Clonación de Objetos) ===
  const handleCloneCourse = (course) => {
    // Clonamos el objeto existente y removemos identificadores primarios
    const clonedCourse = {
      ...course,
      id: undefined, // Forzamos creación de un registro nuevo
      title: `${course.title} (Copia)`,
      status: 'draft', // Comienza en borrador
      enrolled_count: 0
    };
    
    // Abrimos el formulario de creación con los datos clonados
    openModal(clonedCourse);
    addToast({ message: 'Prototipo de curso clonado. Revisa y Guarda.', type: 'info' });
  };

  const deleteCourse = async (id) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;

      setCourses(prev => prev.filter(c => c.id !== id));
      addToast({ message: 'Curso eliminado correctamente', type: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      addToast({ message: 'Error al eliminar. Puede que tenga inscripciones asociadas.', type: 'error' });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.professors?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 m-0">Gestionar Cursos</h1>
          <p className="text-slate-400 text-sm m-0">{courses.length} cursos registrados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/30 border-none cursor-pointer"
        >
          <Plus size={16} />
          Nuevo Curso
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por título o profesor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-slate-800 border-none rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Curso</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Profesor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cupos</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Publicado</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan="7">
                    <div className="h-8 bg-slate-700 rounded-lg animate-pulse" />
                  </td>
                </tr>
              ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                    No se encontraron cursos.
                  </td>
                </tr>
              )
              : filtered.map((course) => {
                const available = course.capacity - (course.enrolled_count || 0);
                return (
                  <tr key={course.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-white font-medium text-sm line-clamp-1 m-0">{course.title}</p>
                      <p className="text-slate-500 text-xs line-clamp-1 mt-0.5 m-0">{course.schedule}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {course.professors?.name || <span className="text-slate-500 italic">Sin asignar</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users size={13} className="text-slate-500" />
                        <span className={available <= 0 ? 'text-red-400' : 'text-slate-300'}>
                          {course.enrolled_count || 0}/{course.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-300">
                        <DollarSign size={13} className="text-slate-500" />
                        {Number(course.price).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Publish toggle switch inline CSS + Tailwind */}
                      <div className="flex items-center justify-start">
                        <button
                          onClick={() => toggleStatus(course.id, course.status)}
                          disabled={isToggling === course.id}
                          className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 border-none cursor-pointer p-0 ${course.status === 'published' ? 'bg-green-500' : 'bg-slate-600'}`}
                          title={course.status === 'published' ? 'Despublicar' : 'Publicar'}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${course.status === 'published' ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[course.status] || statusColors.draft}`}>
                        {statusLabels[course.status] || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCloneCourse(course)}
                          className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
                          title="Clonar (Prototipo)"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={() => openModal(course)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(course)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1 m-0">¿Eliminar curso?</h3>
            <p className="text-slate-400 text-sm mb-6 mt-1">
              Estás a punto de eliminar <strong className="text-white">"{deleteTarget.title}"</strong>.
              Si el curso tiene inscripciones, esta acción fallará por seguridad.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteCourse(deleteTarget.id)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[95vh] relative text-sm">
            
            {/* Header with Close icon */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-base m-0">
                {selectedCourse ? 'Editar Curso' : 'Nuevo Curso'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-0 border-none bg-transparent hover:text-white text-slate-500 cursor-pointer">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Image Upload Area */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 bg-slate-700 border border-slate-600 rounded-2xl flex items-center justify-center text-slate-500 overflow-hidden">
                {formData.thumbnail_url ? (
                  <img src={formData.thumbnail_url} alt="Course" className="w-full h-full object-cover" />
                ) : (
                  <Image size={22} className="text-slate-500" />
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border-none cursor-pointer">
                  <Upload size={13} className="text-slate-400" /> Subir imagen
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadImage} />
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Título *</label>
                <input type="text" placeholder="Nombre del curso" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Descripción</label>
                <textarea rows="3" placeholder="Descripción detallada del curso..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Profesor *</label>
                  <select value={formData.professor_id} onChange={e => setFormData({ ...formData, professor_id: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                    <option value="">— Sin asignar —</option>
                    {professors.map(prof => <option key={prof.id} value={prof.id}>{prof.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Categoría *</label>
                  <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                    <option value="">— Seleccionar —</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Precio (USD) *</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Capacidad *</label>
                  <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Fecha inicio *</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Fecha fin *</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Días de clase</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border-none cursor-pointer transition-colors ${formData.days_of_week?.includes(day) ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Hora inicio</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Hora fin</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="bg-slate-700/30 p-3 rounded-xl flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: formData.status === 'published' ? 'draft' : 'published' })}
                  className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 border-none cursor-pointer p-0 ${formData.status === 'published' ? 'bg-indigo-600' : 'bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.status === 'published' ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <div>
                  <span className="text-slate-200 text-sm font-medium">Borrador</span>
                  <p className="text-slate-500 text-[11px] m-0">Solo visible para administradores</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-all border-none cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all disabled:opacity-50 border-none cursor-pointer">
                  {isSaving ? 'Guardando...' : (selectedCourse ? 'Guardar Cambios' : 'Crear Curso')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
