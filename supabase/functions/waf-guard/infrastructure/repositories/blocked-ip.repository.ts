/**
 * CAPA: Infrastructure — Repositories
 * ARCHIVO: blocked-ip.repository.ts
 *
 * Implementación concreta del puerto IBlockedIpRepository.
 * Única clase que "conoce" Supabase. Si en el futuro se cambia
 * a otro proveedor (ej. PlanetScale, Neon), solo este archivo cambia.
 *
 * Usa SIEMPRE service_role key para bypassear RLS y escribir
 * en security_blocked_ips sin restricciones.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  BlockedIp,
  CreateBlockedIpDto,
  IBlockedIpRepository,
  IpCheckResult,
} from "../../domain/entities/blocked-ip.entity.ts";

const TABLE = "security_blocked_ips" as const;

export class SupabaseBlockedIpRepository implements IBlockedIpRepository {
  private readonly client: SupabaseClient;

  constructor() {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
      throw new Error(
        "[WAF] Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    // service_role bypasea RLS — CRÍTICO para poder escribir en la tabla
    this.client = createClient(url, key);
  }

  // ─── isBlocked ─────────────────────────────────────────────────────────────

  async isBlocked(ip: string): Promise<IpCheckResult> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("reason, created_at, expires_at")
      .eq("ip_address", ip)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .maybeSingle();

    if (error) {
      // No bloquear el tráfico si la DB falla (fail-open)
      console.error("[WAF] Error consultando IP bloqueada:", error.message);
      return { isBlocked: false };
    }

    if (!data) {
      return { isBlocked: false };
    }

    return {
      isBlocked: true,
      reason: data.reason,
      blockedAt: data.created_at,
    };
  }

  // ─── block ─────────────────────────────────────────────────────────────────

  async block(dto: CreateBlockedIpDto): Promise<BlockedIp> {
    // Limitar la longitud del payload para prevenir DoS por datos enormes
    const sanitizedReason = dto.reason.slice(0, 500);

    const payload = {
      ip_address: dto.ip_address,
      reason: sanitizedReason,
      endpoint_attacked: dto.endpoint_attacked,
      threat_score: dto.threat_score ?? 100,
      user_agent: dto.user_agent ?? null,
      expires_at: dto.expires_at ?? null, // null = ban permanente
    };

    const { data, error } = await this.client
      .from(TABLE)
      .upsert(payload, {
        onConflict: "ip_address",   // Si ya existe, actualiza
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`[WAF] Error registrando IP bloqueada: ${error.message}`);
    }

    // Incrementar contador de intentos si el registro ya existía
    await this.client.rpc("increment_blocked_ip_attempts", {
      p_ip: dto.ip_address,
    }).then(({ error: rpcError }) => {
      if (rpcError) {
        // No es crítico, continuar
        console.warn("[WAF] No se pudo incrementar contador de intentos:", rpcError.message);
      }
    });

    return data as BlockedIp;
  }

  // ─── unblock ───────────────────────────────────────────────────────────────

  async unblock(ip: string): Promise<void> {
    const { error } = await this.client
      .from(TABLE)
      .delete()
      .eq("ip_address", ip);

    if (error) {
      throw new Error(`[WAF] Error desbloqueando IP: ${error.message}`);
    }
  }
}
