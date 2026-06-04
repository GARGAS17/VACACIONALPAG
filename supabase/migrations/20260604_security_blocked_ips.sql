-- ============================================================
-- MIGRACIÓN: Sistema de Defensa Activa contra SQLi
-- Tabla: security_blocked_ips
-- Autor: WAF / Clean Architecture Layer
-- Fecha: 2026-06-04
-- ============================================================

-- 1. CREAR LA TABLA DE IPs BLOQUEADAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_blocked_ips (
  id            uuid          NOT NULL DEFAULT uuid_generate_v4(),
  ip_address    inet          NOT NULL,
  reason        text          NOT NULL,                   -- Payload malicioso detectado (truncado a 500 chars)
  endpoint_attacked text      NOT NULL DEFAULT 'unknown', -- Endpoint donde se detectó el ataque
  threat_score  integer       NOT NULL DEFAULT 100        -- Severidad 0-100 (100 = bloqueo inmediato)
                              CHECK (threat_score >= 0 AND threat_score <= 100),
  attempts      integer       NOT NULL DEFAULT 1          -- Número de intentos del atacante
                              CHECK (attempts >= 1),
  user_agent    text,                                     -- User-Agent del atacante (para huellas digitales)
  expires_at    timestamptz,                              -- NULL = ban permanente; fecha = ban temporal
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT security_blocked_ips_pkey PRIMARY KEY (id),
  CONSTRAINT security_blocked_ips_ip_unique UNIQUE (ip_address)
);

-- 2. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================
COMMENT ON TABLE  public.security_blocked_ips              IS 'Registro de IPs bloqueadas por el WAF tras detectar intentos de SQLi u otros ataques.';
COMMENT ON COLUMN public.security_blocked_ips.ip_address   IS 'Dirección IP del atacante en formato inet (IPv4/IPv6).';
COMMENT ON COLUMN public.security_blocked_ips.reason       IS 'Descripción del payload malicioso detectado (máx 500 chars).';
COMMENT ON COLUMN public.security_blocked_ips.threat_score IS 'Puntuación de amenaza 0-100. 100 = bloqueo inmediato.';
COMMENT ON COLUMN public.security_blocked_ips.expires_at   IS 'Fecha de expiración del ban. NULL indica ban permanente.';

-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================
-- Índice principal: lookup por IP en cada petición entrante
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address
  ON public.security_blocked_ips (ip_address);

-- Índice para limpiar bans expirados eficientemente
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires
  ON public.security_blocked_ips (expires_at)
  WHERE expires_at IS NOT NULL;

-- Índice para consultas de auditoría por fecha
CREATE INDEX IF NOT EXISTS idx_blocked_ips_created
  ON public.security_blocked_ips (created_at DESC);

-- 4. TRIGGER: auto-actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_blocked_ip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blocked_ip_updated_at ON public.security_blocked_ips;
CREATE TRIGGER trg_blocked_ip_updated_at
  BEFORE UPDATE ON public.security_blocked_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_blocked_ip_updated_at();

-- 5. FUNCIÓN DE LIMPIEZA AUTOMÁTICA (ejecutar periódicamente)
-- ============================================================
-- Elimina bans expirados para mantener la tabla limpia.
-- Llamar desde un cron job de Supabase o manualmente.
CREATE OR REPLACE FUNCTION public.cleanup_expired_blocked_ips()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.security_blocked_ips
  WHERE expires_at IS NOT NULL AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.cleanup_expired_blocked_ips IS
  'Elimina IPs baneadas cuyo ban ha expirado. Retorna el número de filas eliminadas.';

-- 6. FUNCIÓN DE CONSULTA: ¿Está bloqueada esta IP?
-- ============================================================
-- Usada internamente por el WAF para verificaciones eficientes.
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address inet)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.security_blocked_ips
    WHERE ip_address = p_ip_address
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION public.is_ip_blocked IS
  'Verifica si una IP está en la lista de bloqueo activo (ignorando bans expirados).';

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) — DEFENSA CRÍTICA
-- ============================================================
-- OBJETIVO: Solo el service_role (backend) puede leer/escribir.
-- Los roles 'anon' y 'authenticated' NO tienen acceso alguno.
-- Esto previene que un atacante consulte si su IP está baneada.
-- ============================================================

ALTER TABLE public.security_blocked_ips ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen (idempotencia)
DROP POLICY IF EXISTS "blocked_ips_service_role_all"   ON public.security_blocked_ips;
DROP POLICY IF EXISTS "blocked_ips_deny_anon"          ON public.security_blocked_ips;
DROP POLICY IF EXISTS "blocked_ips_deny_authenticated" ON public.security_blocked_ips;

-- POLÍTICA: service_role puede hacer TODO (sin restricción de RLS)
-- Nota: service_role bypasea RLS por defecto en Supabase,
-- pero lo declaramos explícitamente para documentación y claridad.
CREATE POLICY "blocked_ips_service_role_all"
  ON public.security_blocked_ips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- POLÍTICA: anon NO puede hacer nada (denegación explícita)
CREATE POLICY "blocked_ips_deny_anon"
  ON public.security_blocked_ips
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- POLÍTICA: authenticated NO puede hacer nada (ni admins de la app)
CREATE POLICY "blocked_ips_deny_authenticated"
  ON public.security_blocked_ips
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- FUNCIÓN RPC: Incrementar contador de intentos de ataque
-- ============================================================
-- Llamada por el repositorio cuando una IP ya bloqueada
-- vuelve a intentar atacar. Operación atómica (no race condition).
CREATE OR REPLACE FUNCTION public.increment_blocked_ip_attempts(p_ip inet)
RETURNS void AS $$
BEGIN
  UPDATE public.security_blocked_ips
  SET
    attempts   = attempts + 1,
    updated_at = now()
  WHERE ip_address = p_ip;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.increment_blocked_ip_attempts IS
  'Incrementa el contador de intentos de ataque de una IP bloqueada de forma atómica.';

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Ejecutar para confirmar que la tabla y políticas están activas:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'security_blocked_ips';
--
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'security_blocked_ips';
-- ============================================================
