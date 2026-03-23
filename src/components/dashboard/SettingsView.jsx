import React, { useState } from 'react';
import { Bell, Shield, Globe, Moon, Settings, Lock, Check } from 'lucide-react';
import { supabase } from '../../api/supabase';

export default function SettingsView() {
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(false);
  
  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'password' | 'language' | null
  
  // Form Password
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  
  // Form Language
  const [language, setLanguage] = useState('es');

  const toggleDarkMode = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setIsUpdatingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Contraseña actualizada con éxito');
      setActiveModal(null);
      setNewPassword('');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Ajustes</h1>
        <p className="text-sm text-slate-500">Configura tu experiencia en la plataforma</p>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Notificaciones */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-500">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="text-slate-700 font-semibold text-sm m-0">Notificaciones</h3>
              <p className="text-slate-400 text-xs m-0">Configura qué alertas quieres recibir</p>
            </div>
          </div>
          <button 
            onClick={() => setNotif(!notif)} 
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none p-0 ${notif ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notif ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Privacidad - Cambiar Contraseña */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-500">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="text-slate-700 font-semibold text-sm m-0">Privacidad y Seguridad</h3>
              <p className="text-slate-400 text-xs m-0">Cambia tu contraseña y gestiona la seguridad</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveModal('password')}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl cursor-pointer border-none"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Idioma */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-500">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-slate-700 font-semibold text-sm m-0">Idioma y Región</h3>
              <p className="text-slate-400 text-xs m-0">Personaliza tu ubicación y moneda</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveModal('language')}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl cursor-pointer border-none"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Apariencia */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-500">
              <Moon size={22} />
            </div>
            <div>
              <h3 className="text-slate-700 font-semibold text-sm m-0">Apariencia</h3>
              <p className="text-slate-400 text-xs m-0">Cambia entre modo claro y oscuro</p>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode} 
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer border-none p-0 ${dark ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${dark ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* --- MODAL DE CONTRASEÑA --- */}
      {activeModal === 'password' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setActiveModal(null) }}>
          <div className="modal-content relative max-w-lg w-full p-5">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-sm m-0">Actualizar Contraseña</h3>
                  <p className="text-slate-400 text-[11px] m-0">Escribe tu nueva clave secreta</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="flex flex-1 gap-2 items-center">
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  required
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={isUpdatingPass}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border-none cursor-pointer shadow transition-colors whitespace-nowrap"
                >
                  {isUpdatingPass ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE IDIOMA --- */}
      {activeModal === 'language' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setActiveModal(null) }}>
          <div className="modal-content relative max-w-sm w-full p-6">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer" onClick={() => setActiveModal(null)}>
              ✕
            </button>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-2">
                <Globe size={22} />
              </div>
              <h3 className="text-slate-800 font-bold text-sm mb-1 m-0">Idioma & Región</h3>
              <p className="text-slate-400 text-xs m-0">Selecciona tu idioma preferido</p>
            </div>

            <div className="space-y-2">
              {['Español (es)', 'English (en)'].map((l, index) => {
                const code = index === 0 ? 'es' : 'en';
                const isSelected = language === code;
                return (
                  <button 
                    key={code}
                    onClick={() => { setLanguage(code); alert('Idioma previsualizado cambiado a ' + code); }}
                    className={`w-full p-4 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                  >
                    <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>{l}</span>
                    {isSelected && <Check size={16} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
