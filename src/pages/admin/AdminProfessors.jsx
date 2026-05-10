import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabase';
import { Plus, Search, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

export const AdminProfessors = () => {
  const addToast = useNotificationStore((state) => state.addToast);
  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const PAGE_SIZE = 8;

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', bio: '', photo_url: '', specialization: '', hourly_rate: 0, is_active: true
  });

  const fileInputRef = useRef(null);



  const fetchProfessors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('name');
      if (error) throw error;
      setProfessors(data || []);
    } catch (err) {
      addToast({ message: 'Error cargando profesores', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProfessor ? selectedProfessor.id : 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // bucket root path

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

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      addToast({ message: 'Carga exitosa', type: 'success' });
    } catch (err) {
      addToast({ message: 'Error al subir foto: ' + err.message + ' (Crea el bucket "avatars" en Supabase si no existe)', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (prof = null) => {
    setSelectedProfessor(prof);
    setFormData({
      name: prof?.name || '',
      email: prof?.email || '',
      phone: prof?.phone || '',
      bio: prof?.bio || '',
      photo_url: prof?.photo_url || '',
      specialization: prof?.specialization || '',
      hourly_rate: prof?.hourly_rate || 0,
      is_active: prof?.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        bio: formData.bio || '',
        photo_url: formData.photo_url || null,
        specialization: formData.specialization || '',
        hourly_rate: Number(formData.hourly_rate),
        is_active: formData.is_active
      };

      if (selectedProfessor) {
        const { error } = await supabase
          .from('professors')
          .update(payload)
          .eq('id', selectedProfessor.id);
        if (error) throw error;
        setProfessors(prev => prev.map(p => p.id === selectedProfessor.id ? { ...p, ...payload } : p));
        addToast({ message: 'Profesor actualizado', type: 'success' });
      } else {
        const { data, error } = await supabase
          .from('professors')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setProfessors(prev => [...prev, data]);
        addToast({ message: 'Profesor creado', type: 'success' });
      }
      setIsModalOpen(false);
    } catch (err) {
      addToast({ message: 'Error al guardar: ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const deleteProfessor = async (id) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('professors').delete().eq('id', id);
      if (error) throw error;

      setProfessors(prev => prev.filter(p => p.id !== id));
      addToast({ message: 'Profesor eliminado correctamente', type: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      if (err.message.includes('foreign key') || err.message.includes('violates')) {
        addToast({ message: 'No puedes eliminar este profesor porque tiene cursos asignados. Reasigna o elimina los cursos primero.', type: 'error' });
      } else {
        addToast({ message: 'Error al eliminar: ' + err.message, type: 'error' });
      }
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = professors.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 m-0">Gestionar Profesores</h1>
          <p className="text-slate-400 text-sm m-0">{professors.length} profesores registrados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/30 border-none cursor-pointer"
        >
          <Plus size={16} />
          Nuevo Profesor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-slate-800 border-none rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Profesor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan="4">
                    <div className="h-8 bg-slate-700 rounded-lg animate-pulse" />
                  </td>
                </tr>
              ))
              : paginated.length === 0
              ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                    No se encontraron profesores.
                  </td>
                </tr>
              )
              : paginated.map((prof) => (
                <tr key={prof.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prof.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=6366f1&color=fff`}
                        alt={prof.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-medium text-sm m-0">{prof.name}</p>
                        <p className="text-slate-500 text-xs line-clamp-1 m-0 mt-0.5">{prof.bio || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">{prof.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${prof.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {prof.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {prof.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(prof)}
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(prof)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Pagination bg-slate-800 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <span className="text-slate-400 text-sm">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white disabled:opacity-30 bg-slate-700 rounded-lg border-none cursor-pointer disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white disabled:opacity-30 bg-slate-700 rounded-lg border-none cursor-pointer disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1 m-0">¿Eliminar profesor?</h3>
            <p className="text-slate-400 text-sm mb-6 mt-1">
              Estás a punto de eliminar a <strong className="text-white">{deleteTarget.name}</strong>.
              Si tiene cursos asignados, el sistema te lo notificará.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-all border-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteProfessor(deleteTarget.id)}
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
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[95vh] relative text-sm">
            
            {/* Header with Close icon */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-base m-0">
                {selectedProfessor ? 'Editar Profesor' : 'Nuevo Profesor'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-0 border-none bg-transparent hover:text-white text-slate-500 cursor-pointer">
                <Plus size={20} className="rotate-45" /> {/* Rotating Plus for X */}
              </button>
            </div>

            {/* Profile Image Upload Area */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 bg-slate-700 border border-slate-600 rounded-2xl flex items-center justify-center text-slate-500 overflow-hidden">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Plus size={22} className="text-slate-500" />
                )}
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border-none cursor-pointer">
                  <Plus size={13} className="text-slate-400 rotate-45" /> Subir foto
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadPhoto} />
                <p className="text-slate-500 text-[10.5px] mt-1 m-0">JPG, PNG, WebP — máx 5MB</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Nombre *</label>
                <input type="text" placeholder="Ej: Dr. Ana García" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
              </div>
              
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Email *</label>
                <input type="email" placeholder="profesor@universidad.edu.co" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Biografía</label>
                <textarea rows="3" placeholder="Descripción profesional del profesor..." value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-500" />
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 border-none cursor-pointer p-0 ${formData.is_active ? 'bg-green-500' : 'bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <span className="text-slate-200 text-sm font-medium">Activo</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-all border-none cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all disabled:opacity-50 border-none cursor-pointer">
                  {isSaving ? 'Guardando...' : (selectedProfessor ? 'Guardar Cambios' : 'Crear Profesor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
