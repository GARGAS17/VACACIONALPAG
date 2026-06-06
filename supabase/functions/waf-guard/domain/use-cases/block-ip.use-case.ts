/**
 * CAPA: Domain — Use Cases
 * ARCHIVO: block-ip.use-case.ts
 *
 * Caso de Uso: Registrar una IP como bloqueada tras detectar un ataque.
 *
 * Flujo:
 *   1. Registrar en la BD vía repositorio (upsert — incrementa intentos si ya existe)
 *   2. Invalidar la entrada de caché para que la próxima verificación
 *      lea el estado actualizado desde la BD
 *   3. Loguear el evento de seguridad
 */

import type {
  BlockedIp,
  CreateBlockedIpDto,
  IBlockedIpRepository,
} from "../entities/blocked-ip.entity.ts";
import { ipCache } from "../../infrastructure/cache/ip-cache.ts";

export class BlockIpUseCase {
  constructor(private readonly repository: IBlockedIpRepository) {}

  async execute(dto: CreateBlockedIpDto): Promise<BlockedIp> {
    let blocked: BlockedIp;

    try {
      blocked = await this.repository.block(dto);
    } catch (err) {
      console.error("[WAF] BlockIpUseCase — Error al registrar IP:", err);
      throw err;
    }

    // Actualizar caché inmediatamente: la IP ya está bloqueada
    // No esperar al TTL para que el bloqueo sea efectivo de inmediato
    ipCache.set(dto.ip_address, true, dto.reason);

    // Log estructurado del evento de seguridad
    console.warn(
      JSON.stringify({
        event: "WAF_IP_BLOCKED",
        ip: dto.ip_address,
        endpoint: dto.endpoint_attacked,
        reason: dto.reason.slice(0, 100),
        threat_score: dto.threat_score ?? 100,
        timestamp: new Date().toISOString(),
      })
    );

    return blocked;
  }
}
