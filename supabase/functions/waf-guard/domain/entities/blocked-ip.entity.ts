/**
 * CAPA: Domain — Entities
 * ARCHIVO: blocked-ip.entity.ts
 *
 * Entidad pura del dominio. Sin dependencias externas.
 * Define la forma del objeto BlockedIp y el contrato
 * (interfaz) que debe cumplir cualquier repositorio.
 */

// ─── Entidad de Dominio ───────────────────────────────────────────────────────

export interface BlockedIp {
  id?: string;
  ip_address: string;
  reason: string;              // Payload SQLi detectado (truncado)
  endpoint_attacked: string;   // Ej: "/functions/v1/enroll"
  threat_score: number;        // 0–100
  attempts: number;            // Contador de intentos
  user_agent?: string;
  expires_at?: string | null;  // ISO string o null (permanente)
  created_at?: string;
  updated_at?: string;
}

// ─── DTO para crear un nuevo registro de bloqueo ─────────────────────────────

export interface CreateBlockedIpDto {
  ip_address: string;
  reason: string;
  endpoint_attacked: string;
  threat_score?: number;       // Default: 100
  user_agent?: string;
  expires_at?: string | null;  // null = permanente
}

// ─── Resultado de verificación ───────────────────────────────────────────────

export interface IpCheckResult {
  isBlocked: boolean;
  reason?: string;
  blockedAt?: string;
}

// ─── Contrato del Repositorio (Puerto) ───────────────────────────────────────
// Permite invertir la dependencia: el dominio no conoce Supabase.
// Solo conoce esta interfaz abstracta.

export interface IBlockedIpRepository {
  /**
   * Verifica si una IP está bloqueada (ban activo, no expirado).
   */
  isBlocked(ip: string): Promise<IpCheckResult>;

  /**
   * Registra una nueva IP bloqueada o incrementa su contador de intentos.
   */
  block(dto: CreateBlockedIpDto): Promise<BlockedIp>;

  /**
   * Desbloquea una IP (eliminación del registro).
   */
  unblock(ip: string): Promise<void>;
}
