/**
 * EDGE FUNCTION: waf-guard
 * ARCHIVO: index.ts — Entry Point / Orquestador
 *
 * Esta función puede usarse de DOS formas:
 *
 * MODO 1 — Standalone (recomendado):
 *   El frontend llama a waf-guard ANTES de llamar a otra función.
 *   waf-guard retorna 200 (libre) o 403 (bloqueado/ataque).
 *
 * MODO 2 — Librería compartida (futuro):
 *   Otras Edge Functions importan runWafCheck() y lo llaman
 *   al inicio de su propio handler.
 *
 * Clean Architecture — Flujo de dependencias:
 *
 *   index.ts (Entry)
 *       │
 *       ├──► extractClientIp()           [Adapter]
 *       ├──► sqliStrategy.scan()         [Adapter / Strategy]
 *       ├──► CheckBlockedIpUseCase       [Domain Use Case]
 *       │         └── IpCache            [Infrastructure]
 *       │         └── SupabaseRepository [Infrastructure]
 *       └──► BlockIpUseCase             [Domain Use Case]
 *                 └── SupabaseRepository [Infrastructure]
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Adapters
import { extractClientIp } from "./adapters/ip-extractor.ts";
import { sqliStrategy }    from "./adapters/strategies/sqli-detection.strategy.ts";

// Infrastructure
import { SupabaseBlockedIpRepository } from "./infrastructure/repositories/blocked-ip.repository.ts";

// Domain — Use Cases
import { CheckBlockedIpUseCase } from "./domain/use-cases/check-blocked-ip.use-case.ts";
import { BlockIpUseCase }        from "./domain/use-cases/block-ip.use-case.ts";

// ─── Composición de Dependencias (Dependency Injection Manual) ───────────────
const repository      = new SupabaseBlockedIpRepository();
const checkBlockedIp  = new CheckBlockedIpUseCase(repository);
const blockIp         = new BlockIpUseCase(repository);

// ─── CORS Headers ────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-waf-endpoint",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Respuestas estándar del WAF ─────────────────────────────────────────────

function respond403(message = "Access Denied"): Response {
  return new Response(
    JSON.stringify({ error: message, code: "WAF_BLOCKED" }),
    { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
}

function respond200(message = "OK"): Response {
  return new Response(
    JSON.stringify({ status: "ok", message }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
}

// ─── Función exportable (Modo 2: uso como librería) ──────────────────────────
/**
 * Ejecuta la verificación WAF completa.
 * Puede importarse en otras Edge Functions para protegerlas.
 *
 * @returns Response con 403 si hay amenaza, null si el tráfico es legítimo.
 */
export async function runWafCheck(
  req: Request,
  endpoint: string
): Promise<Response | null> {
  const ip        = extractClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  // ── FILTRO 1: Verificar si la IP ya está bloqueada ───────────────────────
  const ipCheck = await checkBlockedIp.execute(ip);
  if (ipCheck.isBlocked) {
    console.info(`[WAF] IP bloqueada rechazada: ${ip} — ${ipCheck.reason}`);
    return respond403("Su dirección IP ha sido bloqueada por actividad sospechosa.");
  }

  // ── FILTRO 2: Escanear body/query/params en busca de SQLi ────────────────
  let body: Record<string, unknown> = {};
  try {
    // Solo parsear si hay Content-Type application/json
    const contentType = req.headers.get("content-type") ?? "";
    if (req.body && contentType.includes("application/json")) {
      // Clonar el request para no consumir el body original
      const cloned = req.clone();
      const text = await cloned.text();
      if (text.trim().length > 0) {
        body = JSON.parse(text);
      }
    }
  } catch {
    // Body no es JSON válido — continuar con objeto vacío
    body = {};
  }

  // Construir objeto de inputs combinando URL params + body
  const url        = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => { queryParams[key] = value; });

  const allInputs: Record<string, unknown> = {
    ...queryParams,
    ...body,
    _path: url.pathname,        // También escanear el path
    _userAgent: userAgent,
  };

  const detection = sqliStrategy.scan(allInputs);

  if (detection.detected) {
    const reason = `[${detection.severity.toUpperCase()}] Pattern: ${detection.matchedPattern} | Value: ${detection.matchedValue}`;

    console.warn(`[WAF] SQLi detectado: IP=${ip} Endpoint=${endpoint} Pattern=${detection.matchedPattern}`);

    // Registrar IP y bloquearla
    try {
      if (ip !== "unknown" && ip !== "invalid") {
        await blockIp.execute({
          ip_address:       ip,
          reason:           reason,
          endpoint_attacked: endpoint,
          threat_score:     detection.severity === "critical" ? 100
                          : detection.severity === "high"     ?  75
                          : detection.severity === "medium"   ?  50
                          :                                      25,
          user_agent:       userAgent,
          expires_at:       null, // Ban permanente (modificar para temporal)
        });
      } else {
        console.warn(`[WAF] Amenaza detectada pero no se pudo determinar la IP del cliente. IP="${ip}"`);
      }
    } catch (err) {
      // Si falla el registro, igual retornar 403
      console.error("[WAF] Error al registrar bloqueo:", err);
    }

    return respond403("Solicitud bloqueada: se detectó contenido malicioso.");
  }

  // ── Tráfico legítimo → retornar null (el caller continúa) ───────────────
  return null;
}

// ─── Entry Point Standalone (Modo 1) ─────────────────────────────────────────

serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const endpoint = req.headers.get("x-waf-endpoint") ?? "waf-guard";
    const blocked  = await runWafCheck(req, endpoint);

    if (blocked) return blocked;

    return respond200("Tráfico verificado. Sin amenazas detectadas.");
  } catch (err) {
    console.error("[WAF] Error inesperado en waf-guard:", err);
    // Fail-open: si el WAF falla, no bloquear el tráfico legítimo
    return respond200("WAF check omitido por error interno.");
  }
});
