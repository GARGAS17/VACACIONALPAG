import { supabase } from '../../../infrastructure/supabase';

/**
 * Parsea el error de WAF para determinar si es un bloqueo válido
 */
const parseWafError = async (wafError) => {
  let isBlocked = false;
  
  if (wafError.context && typeof wafError.context.text === 'function') {
    try {
      const jsonRaw = await wafError.context.text();
      const json = JSON.parse(jsonRaw);
      if (json?.code === 'ERROR_IP_BLOCKED') isBlocked = true;
    } catch (e) {
      if (wafError.message && wafError.message.includes('403')) isBlocked = true;
    }
  } else if (wafError.message && wafError.message.includes('403')) {
    isBlocked = true;
  }
  
  if (wafError.status === 403) {
    isBlocked = true;
  }
  
  return isBlocked;
};

/**
 * Chequeo pasivo usado por el WafGate en la carga inicial y navegación
 */
export const checkWafStatus = async () => {
  try {
    const { error: wafError } = await supabase.functions.invoke('waf-guard', {
      method: 'GET'
    });
    
    if (wafError) {
      return await parseWafError(wafError);
    }
    return false; // No está bloqueado
  } catch (error) {
    console.warn('WAF check bypassed due to network error');
    return false;
  }
};

/**
 * Verificación activa usada en formularios de envío (ej: Auth.jsx)
 */
export const verifyWafRequest = async (endpoint, payload) => {
  try {
    const { error: wafError } = await supabase.functions.invoke('waf-guard', {
      method: 'POST',
      body: payload,
      headers: { 'x-waf-endpoint': endpoint }
    });

    if (wafError) {
      return await parseWafError(wafError);
    }
    return false; // Seguro
  } catch (err) {
    console.warn('WAF bypassed due to network error');
    return false; // Seguro en caso de error de red (fail-open por accesibilidad, aunque ajustable)
  }
};
