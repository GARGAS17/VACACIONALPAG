/**
 * CAPA: Domain — Use Cases
 * ARCHIVO: check-blocked-ip.use-case.ts
 *
 * Caso de Uso: Verificar si una IP está bloqueada.
 *
 * Flujo:
 *   1. Consultar caché in-memory (0 hits a DB si hay HIT)
 *   2. Si MISS → consultar repositorio (Supabase)
 *   3. Cachear el resultado para futuras peticiones
 *   4. Retornar resultado
 *
 * Este caso de uso se ejecuta en CADA petición entrante,
 * por eso la capa de caché es crítica para el rendimiento.
 */

import type { IBlockedIpRepository, IpCheckResult } from "../entities/blocked-ip.entity.ts";
import { ipCache } from "../../infrastructure/cache/ip-cache.ts";

export class CheckBlockedIpUseCase {
  constructor(private readonly repository: IBlockedIpRepository) {}

  async execute(ip: string): Promise<IpCheckResult> {
    // IPs inválidas/desconocidas no se bloquean (fail-open)
    if (!ip || ip === "unknown" || ip === "invalid") {
      return { isBlocked: false };
    }

    // 1️⃣ Consultar caché primero
    const cached = ipCache.get(ip);
    if (cached !== undefined) {
      return {
        isBlocked: cached.isBlocked,
        reason: cached.reason,
      };
    }

    // 2️⃣ MISS de caché — consultar base de datos
    let result: IpCheckResult;
    try {
      result = await this.repository.isBlocked(ip);
    } catch (err) {
      // Si la DB falla, dejamos pasar (fail-open)
      // Evitar que un fallo de BD bloquee toda la aplicación
      console.error("[WAF] CheckBlockedIpUseCase — DB error:", err);
      return { isBlocked: false };
    }

    // 3️⃣ Cachear resultado para las próximas 5 minutos
    ipCache.set(ip, result.isBlocked, result.reason);

    return result;
  }
}
