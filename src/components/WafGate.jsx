import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function WafGate({ children }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isCheckingNow = false;

    const checkWafStatus = async () => {
      if (isCheckingNow) return;
      isCheckingNow = true;

      try {
        const { error: wafError } = await supabase.functions.invoke('waf-guard', {
          method: 'GET'
        });

        let isRealBlock = false;
        if (wafError) {
          if (wafError.context && typeof wafError.context.text === 'function') {
            try {
              const bodyText = await wafError.context.text();
              const parsed = JSON.parse(bodyText);
              if (parsed?.code === 'ERROR_IP_BLOCKED') {
                isRealBlock = true;
              }
            } catch (e) {}
          } else if (wafError.message && wafError.message.includes('403')) {
            isRealBlock = true;
          }
          
          if (wafError.status === 403) {
             isRealBlock = true;
          }
        }

        if (isRealBlock) {
          setIsBlocked(true);
          await supabase.auth.signOut();
          if (window.location.pathname !== '/bloqueado') {
            navigate('/bloqueado', { replace: true });
          }
        } else {
          setIsBlocked(false);
          if (window.location.pathname === '/bloqueado') {
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.warn('WAF check bypassed due to network error');
      } finally {
        isCheckingNow = false;
        setIsChecking(false);
      }
    };

    // 1. Chequeo inicial y en cambios de ruta
    checkWafStatus();

    // 2. Chequeo automático cuando el usuario regresa a la pestaña
    const handleFocus = () => checkWafStatus();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkWafStatus();
    });

    // 3. Polling de rescate (cada 5 segundos) SOLO si está en la pantalla de bloqueo
    let intervalId;
    if (location.pathname === '/bloqueado') {
      intervalId = setInterval(() => {
        checkWafStatus();
      }, 5000);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      if (intervalId) clearInterval(intervalId);
    };
  }, [navigate, location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Si está bloqueado y no estamos en la ruta de bloqueo, no renderizamos los children
  if (isBlocked && location.pathname !== '/bloqueado') {
    return null;
  }

  return <>{children}</>;
}
