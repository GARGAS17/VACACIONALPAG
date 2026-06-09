/**
 * CAPA: Infrastructure — Cache
 * ARCHIVO: ip-cache.ts
 *
 * Caché in-memory con TTL (Time-To-Live) usando un Map nativo.
 * Evita consultar Supabase en cada petición entrante para IPs
 * ya verificadas. En Deno Edge Functions el estado persiste
 * durante el tiempo de vida de la instancia del worker.
 *
 * Estrategia:
 *   - HIT bloqueada  → 403 inmediato (0 DB hits)
 *   - HIT libre      → continúa (0 DB hits)
 *   - MISS o expirado → consulta Supabase y cachea resultado
 */

export interface CachedEntry {
  isBlocked: boolean;
  reason?: string;
  cachedAt: number;  // timestamp en ms
}

interface IpCacheOptions {
  /** TTL en milisegundos. Default: 5 minutos */
  ttlMs?: number;
  /** Tamaño máximo del caché para evitar OOM. Default: 10.000 IPs */
  maxSize?: number;
}

export class IpCache {
  private readonly cache: Map<string, CachedEntry>;
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: IpCacheOptions = {}) {
    this.ttlMs   = options.ttlMs   ?? 5 * 60 * 1000; // 5 min
    this.maxSize = options.maxSize ?? 10_000;
    this.cache   = new Map();
  }

  // ─── API Pública ─────────────────────────────────────────────────────────

  /**
   * Obtiene la entrada cacheada para una IP.
   * Retorna undefined si no existe o si el TTL ha expirado.
   */
  get(ip: string): CachedEntry | undefined {
    const entry = this.cache.get(ip);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.cache.delete(ip);
      return undefined;
    }

    return entry;
  }

  /**
   * Almacena el estado de una IP en el caché.
   */
  set(ip: string, isBlocked: boolean, reason?: string): void {
    // Evitar crecimiento ilimitado del Map
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(ip, {
      isBlocked,
      reason,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalida la entrada de una IP (forzar re-consulta a DB).
   * Útil tras bloquear una IP nueva.
   */
  invalidate(ip: string): void {
    this.cache.delete(ip);
  }

  /**
   * Limpia todas las entradas expiradas del caché.
   * Puede ejecutarse periódicamente para liberar memoria.
   */
  purgeExpired(): number {
    let count = 0;
    for (const [ip, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(ip);
        count++;
      }
    }
    return count;
  }

  /** Tamaño actual del caché. */
  get size(): number {
    return this.cache.size;
  }

  // ─── Internos ─────────────────────────────────────────────────────────────

  private isExpired(entry: CachedEntry): boolean {
    return Date.now() - entry.cachedAt > this.ttlMs;
  }

  /**
   * Elimina las 100 entradas más antiguas para hacer espacio.
   * Mantiene el caché bajo control sin vaciarlo completamente.
   */
  private evictOldest(): void {
    const entries = [...this.cache.entries()]
      .sort(([, a], [, b]) => a.cachedAt - b.cachedAt)
      .slice(0, 100);

    for (const [ip] of entries) {
      this.cache.delete(ip);
    }
  }
}

// ─── Singleton del caché ─────────────────────────────────────────────────────
// Instancia compartida a nivel de worker de Deno.
// El TTL de 5 minutos equilibra seguridad vs. performance.
export const ipCache = new IpCache({ ttlMs: 5 * 60 * 1000, maxSize: 10_000 });
