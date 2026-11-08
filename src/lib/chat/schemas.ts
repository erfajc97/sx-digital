/* Contracts of /api/chat: request body, tool inputs/outputs and the events
   streamed back (NDJSON, one ChatEvent per line). */
import { z } from 'zod';

export const MAX_USER_CHARS = 1000;
export const MAX_ASSISTANT_CHARS = 4000;
export const MAX_HISTORY = 40;

export const TRIGGERS = ['manual', 'proactive_pricing', 'form_abandon', 'ads'] as const;
export type Trigger = (typeof TRIGGERS)[number];

const UserMsg = z.object({ role: z.literal('user'), content: z.string().trim().min(1).max(MAX_USER_CHARS) });
const AssistantMsg = z.object({ role: z.literal('assistant'), content: z.string().max(MAX_ASSISTANT_CHARS) });

export const ChatRequestSchema = z.object({
  sessionId: z.uuid(),
  locale: z.enum(['es', 'en']).default('es'),
  messages: z
    .array(z.discriminatedUnion('role', [UserMsg, AssistantMsg]))
    .min(1)
    .max(MAX_HISTORY)
    .refine((m) => m[m.length - 1]?.role === 'user', { message: 'last message must be from the user' }),
  /** The visitor ticked the privacy checkbox in this conversation. */
  consent: z.boolean().default(false),
  /** Signed server state from the previous turn (see state.ts). */
  state: z.string().max(4000).optional(),
  trigger: z.enum(TRIGGERS).default('manual'),
  page: z.string().max(200).optional(),
  attribution: z.unknown().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/* ---------------------------- tool contracts ---------------------------- */

const short = (max: number) => z.string().trim().min(1).max(max);
const optShort = (max: number) => z.string().trim().max(max).optional();

export const ToolInputs = {
  run_audit: z.object({ url: short(2048), sector: optShort(80) }),
  get_pricing_info: z.object({}).strict(),
  save_lead: z.object({
    nombre: short(100),
    email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
    empresa: optShort(200),
    sector: optShort(80),
    problema: optShort(1000),
    urgencia: optShort(120),
    presupuesto: optShort(120),
    resumen: short(900),
    puntuacion: z.number().min(0).max(100).transform((n) => Math.round(n)),
  }),
  booking_link: z.object({}).strict(),
  whatsapp_handoff: z.object({ resumen: short(700) }),
  start_demo: z.object({ sector: short(80), negocio: optShort(80) }),
  request_consent: z.object({}).strict(),
} as const;
export type ToolName = keyof typeof ToolInputs;
export const TOOL_NAMES = Object.keys(ToolInputs) as ToolName[];

export const AuditToolOutput = z.union([
  z.object({
    ok: z.literal(true),
    url: z.string(),
    puntuacion_web: z.number().int().min(0).max(100),
    hallazgos: z.array(z.object({ titulo: z.string(), problema: z.string(), solucion: z.string() })).min(1).max(3),
  }),
  z.object({ ok: z.literal(false), error: z.enum(['bad_url', 'fetch_failed', 'llm_failed', 'rate_limited']), mensaje: z.string() }),
]);

export const LinkOutput = z.object({ ok: z.literal(true), url: z.url() });
export const SimpleOutput = z.object({ ok: z.boolean(), mensaje: z.string().optional(), error: z.string().optional() }).loose();

/* --------------------------------- events -------------------------------- */

export type UiEvent =
  | { kind: 'audit'; data: z.infer<typeof AuditToolOutput> & { ok: true } }
  | { kind: 'consent' }
  | { kind: 'booking'; url: string }
  | { kind: 'whatsapp'; url: string }
  | { kind: 'demo'; sector: string }
  | { kind: 'demo_end' }
  | { kind: 'lead'; puntuacion: number };

export type ChatEvent =
  | { t: 'text'; d: string }
  | { t: 'reset'; text: string }
  | { t: 'ui'; ui: UiEvent }
  | { t: 'state'; state: string }
  | { t: 'error'; code: 'rate_limited' | 'invalid' | 'unavailable'; message: string; whatsapp: string; booking: string }
  | { t: 'done' };
