import React, { useState } from 'react';
import { Facebook, Globe, Github, Linkedin } from 'lucide-react';
import './Auth.css';
import { supabase } from '../api/supabase';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';

export default function Auth() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useNotificationStore();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    setLoading(false);
    if (error) {
      addToast({ type: 'error', message: error.message });
    } else {
      if (data?.session) {
        addToast({ type: 'success', message: 'Registro completado.' });
        navigate('/');
      } else {
        // En Supabase, si requiere confirmación de correo, session es null
        addToast({ type: 'success', message: 'Registro completado. Por favor, verifica tu correo antes de ingresar.' });
        setIsRightPanelActive(false); // Switch to login
      }
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      const msg = error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')
         ? 'Por favor, confirma tu correo electrónico antes de iniciar sesión.'
         : 'Credenciales inválidas';
      addToast({ type: 'error', message: msg });
    } else if (data?.session) {
      navigate('/');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
        
        {/* Register Container */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <h1>Crear Cuenta</h1>
            <div className="social-container">
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Facebook size={20}/></a>
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Globe size={20}/></a>
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Github size={20}/></a>
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Linkedin size={20}/></a>
            </div>
            <span>o usa tu correo para registrarte</span>
            <input type="text" placeholder="Nombre" value={name} onChange={(e)=>setName(e.target.value)} required />
            <input type="email" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} minLength={6} required />
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'CARGANDO...' : 'REGISTRARSE'}
            </button>
          </form>
        </div>

        {/* Login Container */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignIn}>
            <h1>Iniciar Sesión</h1>
            <div className="social-container">
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Facebook size={20}/></a>
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Globe size={20}/></a>
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Github size={20}/></a>
              <a href="#" className="social" onClick={(e)=>e.preventDefault()}><Linkedin size={20}/></a>
            </div>
            <span>o usa tu cuenta con correo y contraseña</span>
            <input type="email" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            <a href="#">¿Olvidaste tu contraseña?</a>
            <button type="submit" disabled={loading} className="auth-btn">
               {loading ? 'CARGANDO...' : 'INGRESAR'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>¡Bienvenido de nuevo!</h1>
              <p>Para mantenerte conectado con nosotros, por favor inicia sesión con tu información personal</p>
              <button className="ghost auth-btn" type="button" onClick={() => setIsRightPanelActive(false)}>INICIAR SESIÓN</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>¡Hola, Amigo!</h1>
              <p>Introduce tus datos personales y comienza tu viaje con nosotros</p>
              <button className="ghost auth-btn" type="button" onClick={() => setIsRightPanelActive(true)}>REGISTRARSE</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
