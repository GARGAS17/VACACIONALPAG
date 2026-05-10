import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Clock, Phone, Globe, MapPin, AlignLeft } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../api/supabase';
import { useNotificationStore } from '../../store/useNotificationStore';

export default function ProfileView() {
  const { profile, user, fetchProfile } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [notif, setNotif] = useState(true);
  const [alerts, setAlerts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // States for editable fields
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    city: '',
    bio: '',
    preferred_language: 'es'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        city: profile.city || '',
        bio: profile.bio || '',
        preferred_language: profile.preferred_language || 'es'
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          bio: formData.bio,
          preferred_language: formData.preferred_language,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Optimistic update to store to prevent reloading locks
      useAuthStore.setState({ 
        profile: { 
          ...profile, 
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          bio: formData.bio,
          preferred_language: formData.preferred_language,
          updated_at: new Date().toISOString()
        } 
      });

      addToast({ type: 'success', message: 'Perfil actualizado exitosamente' });
    } catch (err) {
      addToast({ type: 'error', message: 'Error al actualizar: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (profile?.full_name || '?').charAt(0).toUpperCase();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-sm text-slate-500">Gestiona tu información personal y académica</p>
      </div>

      <div className="flex gap-6">
        {/* Left Side: Photo Card */}
        <div className="w-1/3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col items-center">
          <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-indigo-50 border-4 border-white rounded-2xl flex items-center justify-center text-indigo-500 font-black text-2xl shadow-sm">
              {initial}
            </div>
          </div>
          <div className="pt-12 pb-6 text-center px-4 w-full">
            <h3 className="text-slate-800 font-bold m-0">{profile?.full_name || 'Camilo Santana'}</h3>
            <p className="text-slate-400 text-xs mt-0.5 m-0 mb-4">{user?.email}</p>
            
            <div className="border-t border-slate-100 pt-4 space-y-2 text-left w-full text-slate-500 text-xs px-2">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-500" />
                <span>{profile?.role === 'admin' ? 'Administrador' : 'Estudiante Regular'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-500" />
                <span>Miembro desde {new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="flex-1 space-y-6">
          {/* Datos Personales */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-4 font-semibold text-sm">
              <User size={18} /> Datos Personales
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Nombre Completo</label>
                <input type="text" value={formData.full_name} className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-slate-800 text-xs focus:outline-none" readOnly />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Correo Electrónico</label>
                <input type="email" value={user?.email} className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-slate-500 text-xs focus:outline-none" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><Phone size={12}/> Teléfono</label>
                <input type="text" placeholder="+57 300 123 4567" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><Globe size={12}/> Idioma</label>
                <select value={formData.preferred_language} onChange={e => setFormData({ ...formData, preferred_language: e.target.value })} className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={12}/> País</label>
                <input type="text" placeholder="Ej. Colombia" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><MapPin size={12}/> Ciudad</label>
                <input type="text" placeholder="Ej. Valledupar" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><AlignLeft size={12}/> Biografía</label>
              <textarea rows="2" placeholder="Cuéntanos un poco sobre ti..." value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
            </div>

            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border-none cursor-pointer shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          {/* Preferencias de Contacto */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-4 font-semibold text-sm">
              <Mail size={18} /> Preferencias de Contacto
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-slate-700 font-bold text-xs m-0">Notificaciones de Cursos</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5 m-0">Recibe avisos sobre nuevos vacacionales</p>
                </div>
                <button onClick={() => setNotif(!notif)} className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none p-0 ${notif ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notif ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-slate-700 font-bold text-xs m-0">Avisos de Pago</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5 m-0">Alertas sobre vencimientos de facturas</p>
                </div>
                <button onClick={() => setAlerts(!alerts)} className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none p-0 ${alerts ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${alerts ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
