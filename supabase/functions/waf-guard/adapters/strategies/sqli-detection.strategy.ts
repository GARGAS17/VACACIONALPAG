/**
 * CAPA: Adapters — Strategies
 * ARCHIVO: sqli-detection.strategy.ts
 *
 * Implementa el PATRÓN STRATEGY para la detección de ataques.
 *
 * Beneficio arquitectónico: Si en el futuro se quiere añadir detección
 * de XSS, Path Traversal o NoSQL injection, solo se crea una nueva clase
 * que implemente IDetectionStrategy sin tocar el código existente.
 *
 * ┌─────────────────────────────────────┐
 * │        IDetectionStrategy           │  ← Interfaz (contrato)
 * └─────────────────────────────────────┘
 *         ▲                ▲
 *         │                │
 * ┌───────┴──────┐  ┌──────┴────────────┐
 * │ SqliDetection│  │ XssDetection       │  ← (futuro)
 * │ Strategy     │  │ Strategy           │
 * └──────────────┘  └───────────────────┘
 */

// ─── Interfaz del Patrón Strategy ────────────────────────────────────────────

export interface DetectionResult {
  detected: boolean;
  matchedPattern?: string;  // Qué patrón disparó la alerta
  matchedValue?: string;    // Qué valor fue detectado (truncado)
  severity: "low" | "medium" | "high" | "critical";
}

export interface IDetectionStrategy {
  /** Nombre de la estrategia (para logs y diagnósticos) */
  readonly name: string;
  /**
   * Analiza un conjunto de pares clave-valor en busca de amenazas.
   * @param inputs - Objeto plano de strings a analizar (body, query, params)
   */
  scan(inputs: Record<string, unknown>): DetectionResult;
}

// ─── Implementación: Estrategia de Detección SQLi ────────────────────────────

/**
 * Firmas de SQLi organizadas por categoría.
 * Cada entrada es: [nombreDelPatrón, expresiónRegular, severidad]
 */
type PatternEntry = [string, RegExp, DetectionResult["severity"]];

const SQL_INJECTION_PATTERNS: PatternEntry[] = [
  // ── Tautologías y operadores booleanos ──────────────────────────────────
  ["tautology_or_1_1",         /\bor\s+1\s*=\s*1\b/i,                "critical"],
  ["tautology_and_1_1",        /\band\s+1\s*=\s*1\b/i,               "high"],
  ["tautology_or_true",        /\bor\s+true\b/i,                     "high"],
  ["tautology_always_true",    /'\s*or\s*'[^']*'\s*=\s*'[^']*/i,    "critical"],
  ["tautology_numeric",        /\d+\s*=\s*\d+\s*(--|#|\/\*)/i,       "high"],

  // ── Comentarios SQL ──────────────────────────────────────────────────────
  ["comment_double_dash",      /--[\s\S]/,                            "critical"],
  ["comment_hash",             /#[\s\S]*$/m,                          "medium"],
  ["comment_block",            /\/\*[\s\S]*?\*\//,                    "high"],
  ["comment_inline_bypass",    /\/\*!\s*\d*/i,                        "high"],  // MySQL !version trick

  // ── UNION-based injection ─────────────────────────────────────────────
  ["union_select",             /\bunion\b[\s\S]*?\bselect\b/i,       "critical"],
  ["union_all_select",         /\bunion\s+all\s+select\b/i,          "critical"],

  // ── DDL/DML destructivas ─────────────────────────────────────────────
  ["stacked_drop",             /;\s*drop\s+(table|database|schema)\b/i, "critical"],
  ["stacked_insert",           /;\s*insert\s+into\b/i,               "critical"],
  ["stacked_update",           /;\s*update\s+\w+\s+set\b/i,          "critical"],
  ["stacked_delete",           /;\s*delete\s+from\b/i,               "critical"],
  ["stacked_truncate",         /;\s*truncate\s+(table\s+)?\w+/i,     "critical"],
  ["stacked_alter",            /;\s*alter\s+(table|database)\b/i,    "critical"],
  ["stacked_exec",             /;\s*(exec|execute)\s+/i,             "critical"],

  // ── Palabras clave SQL sospechosas en contexto ───────────────────────
  ["keyword_select_from",      /\bselect\b[\s\S]{0,30}\bfrom\b/i,    "high"],
  ["keyword_into_outfile",     /\binto\s+outfile\b/i,                "critical"],
  ["keyword_into_dumpfile",    /\binto\s+dumpfile\b/i,               "critical"],
  ["keyword_load_file",        /\bload_file\s*\(/i,                   "critical"],
  ["keyword_information_schema",/\binformation_schema\b/i,           "high"],
  ["keyword_sysobjects",       /\bsysobjects\b/i,                    "high"],
  ["keyword_pg_sleep",         /\bpg_sleep\s*\(/i,                   "critical"],  // PostgreSQL
  ["keyword_waitfor",          /\bwaitfor\s+delay\b/i,               "critical"],  // SQL Server
  ["keyword_benchmark",        /\bbenchmark\s*\(\s*\d+/i,            "critical"],  // MySQL
  ["keyword_sleep",            /\bsleep\s*\(\s*\d+/i,                "critical"],
  ["keyword_char_function",    /\bchar\s*\(\s*\d+/i,                 "medium"],
  ["keyword_hex_encode",       /\b0x[0-9a-f]{4,}\b/i,               "medium"],
  ["keyword_ascii",            /\bascii\s*\(\s*\w+/i,               "medium"],

  // ── PostgreSQL específico ────────────────────────────────────────────
  ["pg_copy_to",               /\bcopy\s+\w+\s+to\b/i,              "critical"],
  ["pg_dollar_injection",      /\$\$[\s\S]*\$\$/,                   "critical"],  // $$ delimiters
  ["pg_cast_bypass",           /::\s*(text|varchar|int)\s*--/i,     "high"],

  // ── Error-based injection ───────────────────────────────────────────
  ["error_extractvalue",       /\bextractvalue\s*\(/i,              "critical"],
  ["error_updatexml",          /\bupdatexml\s*\(/i,                 "critical"],
  ["error_xmltype",            /\bxmltype\s*\(/i,                   "high"],

  // ── Encoding y evasión ──────────────────────────────────────────────
  ["encoding_url_quote",       /%27/i,                              "high"],       // '
  ["encoding_url_equals",      /%3d/i,                              "medium"],     // =
  ["encoding_url_union",       /(%75|%55)(%6e|%4e)(%69|%49)(%6f|%4f)(%6e|%4e)/i, "critical"],
  ["encoding_double_quote",    /%22/i,                              "medium"],

  // ── Inyección de comillas ────────────────────────────────────────────
  ["quote_single",             /'\s*(or|and|union|select|drop|insert|update|delete|;)\b/i, "critical"],
  ["quote_backslash",          /\\'\s*(or|and)\b/i,                "high"],

  // ── Subconsultas ────────────────────────────────────────────────────
  ["subquery_select",          /\(\s*select\s+/i,                  "high"],
];

// ─── Clase de Estrategia SQLi ────────────────────────────────────────────────

export class SqliDetectionStrategy implements IDetectionStrategy {
  readonly name = "SqliDetectionStrategy";

  private readonly patterns: PatternEntry[];

  constructor() {
    this.patterns = SQL_INJECTION_PATTERNS;
  }

  scan(inputs: Record<string, unknown>): DetectionResult {
    const flatValues = this.flattenInputs(inputs);

    for (const value of flatValues) {
      for (const [patternName, regex, severity] of this.patterns) {
        if (regex.test(value)) {
          return {
            detected: true,
            matchedPattern: patternName,
            matchedValue: value.slice(0, 200), // Truncar para logs
            severity,
          };
        }
      }
    }

    return { detected: false, severity: "low" };
  }

  // ─── Utilitario: aplanar objetos anidados a strings ─────────────────────

  private flattenInputs(obj: unknown, depth = 0): string[] {
    const MAX_DEPTH = 5;   // Prevenir stack overflow en objetos muy anidados
    const MAX_VALUES = 50; // Limitar iteración en objetos muy grandes

    if (depth > MAX_DEPTH) return [];

    const values: string[] = [];

    if (typeof obj === "string") {
      values.push(obj);
    } else if (typeof obj === "number" || typeof obj === "boolean") {
      values.push(String(obj));
    } else if (Array.isArray(obj)) {
      for (const item of obj.slice(0, MAX_VALUES)) {
        values.push(...this.flattenInputs(item, depth + 1));
      }
    } else if (obj && typeof obj === "object") {
      const entries = Object.entries(obj).slice(0, MAX_VALUES);
      for (const [, val] of entries) {
        values.push(...this.flattenInputs(val, depth + 1));
      }
    }

    return values;
  }
}

// ─── Exportar instancia singleton de la estrategia ──────────────────────────
export const sqliStrategy = new SqliDetectionStrategy();
