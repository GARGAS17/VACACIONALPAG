import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const WAF_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-waf-endpoint",
}

// SQL Injections detection logic
const SQLI_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|UNION)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
  /('|")\s*(OR|AND)\s*(\d+=\d+|'[^']*'='[^']*'|"[^"]*"="[^"]*")/i,
  /--/,
  /;/
]

function containsSQLi(obj: any): boolean {
  if (!obj) return false;
  if (typeof obj === 'string') {
    return SQLI_PATTERNS.some(p => p.test(obj));
  }
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (containsSQLi(obj[key])) return true;
    }
  }
  return false;
}

// Connect to Supabase using Service Role (to bypass RLS for blocked IPs table)
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: WAF_CORS_HEADERS })
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(',')[0].trim() || 'unknown'
    const endpoint = req.headers.get("x-waf-endpoint") || "unknown"

    // 1. Verificar si la IP ya está bloqueada
    const { data: blockedIp, error: blockedErr } = await supabase
      .from('security_blocked_ips')
      .select('ip_address')
      .eq('ip_address', clientIp)
      .maybeSingle()

    if (blockedIp) {
      return new Response(
        JSON.stringify({ code: "ERROR_IP_BLOCKED", message: "IP Blocked by WAF" }),
        { status: 403, headers: { ...WAF_CORS_HEADERS, "Content-Type": "application/json" } }
      )
    }

    if (req.method === "GET") {
      // Si es GET y llegamos aquí, la IP no está bloqueada
      return new Response(
        JSON.stringify({ ok: true, status: "clean" }),
        { status: 200, headers: { ...WAF_CORS_HEADERS, "Content-Type": "application/json" } }
      )
    }

    if (req.method === "POST") {
      let bodyData = {}
      try {
        bodyData = await req.json()
      } catch (e) {
        // Ignorar si el body no es JSON válido
      }

      // 2. Escanear el payload en busca de inyecciones SQL
      if (containsSQLi(bodyData)) {
        console.warn(`[WAF] SQLi detectado desde IP: ${clientIp} en endpoint: ${endpoint}`)
        
        // Bloquear la IP
        await supabase
          .from('security_blocked_ips')
          .insert({
            ip_address: clientIp,
            reason: "SQL Injection Detected",
            endpoint_attacked: endpoint
          })

        return new Response(
          JSON.stringify({ code: "ERROR_IP_BLOCKED", message: "Malicious payload detected. IP Blocked." }),
          { status: 403, headers: { ...WAF_CORS_HEADERS, "Content-Type": "application/json" } }
        )
      }

      return new Response(
        JSON.stringify({ ok: true, status: "clean" }),
        { status: 200, headers: { ...WAF_CORS_HEADERS, "Content-Type": "application/json" } }
      )
    }

    return new Response("Method not allowed", { status: 405, headers: WAF_CORS_HEADERS })
  } catch (error: any) {
    console.error("[WAF] Internal Error:", error)
    // Fail open para no bloquear tráfico legítimo por errores de red
    return new Response(
      JSON.stringify({ ok: true, status: "error_bypassed", error: error.message }),
      { status: 200, headers: { ...WAF_CORS_HEADERS, "Content-Type": "application/json" } }
    )
  }
})
