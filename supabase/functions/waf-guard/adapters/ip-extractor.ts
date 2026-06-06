/**
 * CAPA: Adapters
 * ARCHIVO: ip-extractor.ts
 *
 * Extrae la IP real del cliente desde los headers HTTP.
 * Necesario porque en producción (Cloudflare, Supabase Edge Network)
 * la IP directa de la conexión TCP es la del proxy/CDN, no del cliente.
 *
 * Orden de prioridad (de más a menos confiable en Supabase/Cloudflare):
 *   1. CF-Connecting-IP    → Cloudflare (más confiable si usas CF)
 *   2. X-Real-IP          → Nginx reverse proxy
 *   3. X-Forwarded-For    → Estándar HTTP (primer valor = cliente original)
 *   4. x-client-ip        → Alternativa genérica
 *   5. "unknown"          → Fallback si no hay header disponible
 */

export function extractClientIp(req: Request): string {
  // Cloudflare (más confiable en Supabase Edge Functions)
  const cfIp = req.headers.get("CF-Connecting-IP");
  if (cfIp) return normalizeIp(cfIp);

  // Nginx / HAProxy
  const realIp = req.headers.get("X-Real-IP");
  if (realIp) return normalizeIp(realIp);

  // Estándar X-Forwarded-For: "client, proxy1, proxy2"
  const forwarded = req.headers.get("X-Forwarded-For");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return normalizeIp(first);
  }

  // Alternativas menores
  const clientIp = req.headers.get("x-client-ip");
  if (clientIp) return normalizeIp(clientIp);

  const forwardedFor = req.headers.get("Forwarded");
  if (forwardedFor) {
    const match = forwardedFor.match(/for=["[]?([^\]"]+)/i);
    if (match?.[1]) return normalizeIp(match[1]);
  }

  return "unknown";
}

/**
 * Normaliza y valida una IP.
 * Elimina corchetes de IPv6 y espacios.
 * Retorna "invalid" si el formato no es reconocible.
 */
function normalizeIp(raw: string): string {
  const cleaned = raw.trim().replace(/^\[/, "").replace(/\]$/, "");

  // Validación básica: IPv4 o IPv6
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]{2,39}$/;

  if (ipv4.test(cleaned) || ipv6.test(cleaned)) {
    return cleaned;
  }

  return "invalid";
}
