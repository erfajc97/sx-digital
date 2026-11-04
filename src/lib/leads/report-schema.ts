/* The audit report contract.

   `LlmReportSchema` is the shape sent to Claude as a structured-output format
   (kept free of numeric/array-length constraints, which JSON-schema structured
   outputs don't all support). `AuditReportSchema` is the strict contract we
   enforce on whatever comes back before anything is stored or shown. */
import { z } from 'zod';

export const SERVICIOS = ['automatizacion_ia', 'marketing_ads', 'web_app', 'fintech', 'multimedia_ia'] as const;
export type ServicioSolvyx = (typeof SERVICIOS)[number];

const HallazgoBase = z.object({
  titulo: z.string(),
  problema: z.string(),
  impacto: z.string(),
  solucion: z.string(),
  servicio_solvyx: z.enum(SERVICIOS),
});

export const LlmReportSchema = z.object({
  negocio_detectado: z.string(),
  sector: z.string(),
  puntuacion_web: z.number(),
  hallazgos: z.array(HallazgoBase),
  quick_wins: z.array(z.string()),
  lead_score: z.number(),
  resumen_para_ventas: z.string(),
});

const text = (max: number) => z.string().trim().min(1).max(max);
const score = z.number().min(0).max(100).transform((n) => Math.round(n));

export const HallazgoSchema = z.object({
  titulo: text(160),
  problema: text(800),
  impacto: text(800),
  solucion: text(800),
  servicio_solvyx: z.enum(SERVICIOS),
});

export const AuditReportSchema = z.object({
  negocio_detectado: text(200),
  sector: text(120),
  puntuacion_web: score,
  hallazgos: z.array(HallazgoSchema).min(1).max(6),
  quick_wins: z.array(text(300)).length(3),
  lead_score: score,
  resumen_para_ventas: text(900),
});

export type Hallazgo = z.infer<typeof HallazgoSchema>;
export type AuditReport = z.infer<typeof AuditReportSchema>;

export type ValidationResult = { ok: true; report: AuditReport } | { ok: false; error: string };

/** Validates model output. Accepts an object or a JSON string (optionally
    wrapped in ```json fences). Tolerates over-long lists by trimming them to
    the contract (max 6 findings, exactly 3 quick wins) — never pads. */
export function validateReport(raw: unknown): ValidationResult {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
    try {
      value = JSON.parse(stripped);
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = { ...(value as Record<string, unknown>) };
    if (Array.isArray(v.hallazgos)) v.hallazgos = v.hallazgos.slice(0, 6);
    if (Array.isArray(v.quick_wins)) v.quick_wins = v.quick_wins.slice(0, 3);
    value = v;
  }
  const parsed = AuditReportSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join('.') || 'root'}: ${issue.message}` };
  }
  return { ok: true, report: parsed.data };
}

/** What the browser receives: top 3 findings + score, nothing internal. */
export function publicView(report: AuditReport) {
  return {
    negocio_detectado: report.negocio_detectado,
    puntuacion_web: report.puntuacion_web,
    hallazgos: report.hallazgos.slice(0, 3),
  };
}
