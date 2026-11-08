/* Solvy's tools: definitions sent to the model + server-side executors.
   Every input is validated with zod before running and every output is
   validated before it goes back to the model or the browser. */
import type Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import { sanitizeAttribution } from '../analytics/attribution';
import { LIMITS } from '../leads/audit-pipeline';
import { auditReportEmail } from '../leads/email-templates';
import type { SafeFetchOptions } from '../leads/net/safe-fetch';
import { analyzeSite } from '../leads/site-analysis';
import type { Locale, Services } from '../leads/types';
import { userTyped } from './guard';
import { pricingInfo } from './knowledge';
import { buildBookingLink, buildWhatsAppLink } from './links';
import type { IChatLog } from './log-store';
import type { IChatModel } from './model';
import { AuditToolOutput, LinkOutput, SimpleOutput, ToolInputs, type ChatRequest, type ToolName, type UiEvent } from './schemas';
import type { ChatState } from './state';

export interface ChatServices extends Services {
  chat: IChatModel;
  chatLog: IChatLog;
}

export interface ChatConfig {
  bookingUrl: string;
  whatsappNumber: string;
  leadScoreThreshold: number;
  salesEmail: string;
  /** Time we give run_audit inside one chat request. */
  auditBudgetMs: number;
}

export interface ToolCtx {
  services: ChatServices;
  config: ChatConfig;
  req: ChatRequest;
  state: ChatState;
  ipHash: string;
  /** Everything the visitor typed in this conversation. */
  userTexts: string[];
  locale: Locale;
  now: () => number;
  fetchOptions?: SafeFetchOptions;
}

export interface ToolOutcome {
  content: string;
  isError?: boolean;
  ui?: UiEvent[];
}

export const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'run_audit',
    description:
      "Audita la web pública de un negocio (SEO básico, contacto, reservas/pagos, contenido) y devuelve la puntuación y los 3 hallazgos principales. Úsala cuando el usuario quiera auditar su web y haya dado la URL. Tarda unos segundos.",
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Dirección pública de la web, p. ej. "tunegocio.com" o "https://tunegocio.com".' },
        sector: { type: 'string', description: 'Sector del negocio si el usuario lo ha dicho.' },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_pricing_info',
    description: 'Devuelve los planes reales de SolvyX y la política de precios (sin cifras cerradas). Úsala ante cualquier pregunta de precio, coste o presupuesto.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'request_consent',
    description: 'Muestra al usuario la casilla de consentimiento con la política de privacidad. Llámala SIEMPRE antes de pedir el email o cualquier dato personal si consentimiento=no.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'save_lead',
    description:
      'Guarda al usuario como cliente potencial para el equipo comercial. Solo con consentimiento=si y cuando el usuario haya escrito su email. No inventes campos: deja vacíos los que no haya dicho.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        email: { type: 'string', description: 'Email tal y como lo escribió el usuario.' },
        empresa: { type: 'string' },
        sector: { type: 'string' },
        problema: { type: 'string', description: 'Problema principal en palabras del usuario.' },
        urgencia: { type: 'string', description: 'Cuándo lo necesita.' },
        presupuesto: { type: 'string', description: 'Presupuesto aproximado si lo dijo.' },
        resumen: { type: 'string', description: '2-3 frases objetivas para el equipo comercial.' },
        puntuacion: { type: 'number', description: '0-100: probabilidad de que sea un buen cliente.' },
      },
      required: ['nombre', 'email', 'resumen', 'puntuacion'],
    },
  },
  {
    name: 'booking_link',
    description: 'Devuelve el enlace para reservar una llamada de 30 min con SolvyX (con nombre y email ya rellenos si se guardaron). El usuario verá un botón.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'whatsapp_handoff',
    description: 'Devuelve un enlace de WhatsApp a SolvyX con un mensaje ya escrito. El usuario verá un botón.',
    input_schema: {
      type: 'object',
      properties: { resumen: { type: 'string', description: 'Mensaje en primera persona del usuario para SolvyX (máx. 700 caracteres), solo con datos que haya dado.' } },
      required: ['resumen'],
    },
  },
  {
    name: 'start_demo',
    description: 'Activa el modo "Prueba tu propio bot": a partir de aquí actúas como el asistente de un negocio ficticio de ese sector durante máximo 5 turnos.',
    input_schema: {
      type: 'object',
      properties: {
        sector: { type: 'string', description: 'Sector del negocio del usuario, p. ej. "inmobiliaria".' },
        negocio: { type: 'string', description: 'Nombre ficticio que usarás para el negocio.' },
      },
      required: ['sector'],
    },
  },
];

const ok = <T>(schema: z.ZodType<T>, value: T, ui?: UiEvent[]): ToolOutcome => ({ content: JSON.stringify(schema.parse(value)), ui });
const fail = (error: string, mensaje: string, ui?: UiEvent[]): ToolOutcome => ({
  content: JSON.stringify(SimpleOutput.parse({ ok: false, error, mensaje })),
  isError: true,
  ui,
});

export async function executeTool(name: string, rawInput: unknown, ctx: ToolCtx): Promise<ToolOutcome> {
  if (!(name in ToolInputs)) return fail('unknown_tool', `La herramienta ${name} no existe.`);
  const schema = ToolInputs[name as ToolName];
  const parsed = schema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail('invalid_input', `Entrada no válida: ${issue?.path.join('.') || 'input'} ${issue?.message ?? ''}`.trim());
  }
  try {
    switch (name as ToolName) {
      case 'run_audit':
        return await runAuditTool(parsed.data as z.infer<typeof ToolInputs.run_audit>, ctx);
      case 'get_pricing_info':
        return { content: JSON.stringify(pricingInfo()) };
      case 'request_consent':
        if (ctx.req.consent) return ok(SimpleOutput, { ok: true, mensaje: 'El usuario ya dio su consentimiento. Pide el email.' });
        return ok(SimpleOutput, { ok: true, mensaje: 'Casilla mostrada. Pide al usuario que la marque y escriba su email.' }, [{ kind: 'consent' }]);
      case 'save_lead':
        return await saveLeadTool(parsed.data as z.infer<typeof ToolInputs.save_lead>, ctx);
      case 'booking_link': {
        const contact = ctx.req.consent ? ctx.state.lead : undefined;
        const url = buildBookingLink(ctx.config.bookingUrl, contact);
        return ok(LinkOutput, { ok: true, url }, [{ kind: 'booking', url }]);
      }
      case 'whatsapp_handoff': {
        const { resumen } = parsed.data as z.infer<typeof ToolInputs.whatsapp_handoff>;
        const url = buildWhatsAppLink(ctx.config.whatsappNumber, resumen);
        return ok(LinkOutput, { ok: true, url }, [{ kind: 'whatsapp', url }]);
      }
      case 'start_demo': {
        const { sector } = parsed.data as z.infer<typeof ToolInputs.start_demo>;
        if (ctx.state.demo?.done) return fail('demo_used', 'La demo ya se hizo en esta conversación. Propón la llamada o WhatsApp.');
        ctx.state.demo = { sector: sector.slice(0, 40), turns: 0, done: false };
        return ok(SimpleOutput, { ok: true, sector, mensaje: 'Demo activa. Preséntate ya como el asistente del negocio ficticio.' }, [{ kind: 'demo', sector }]);
      }
    }
  } catch (e) {
    console.error(`[chat] tool ${name} failed`, e);
    return fail('tool_failed', 'La herramienta ha fallado. Ofrece la llamada o WhatsApp.');
  }
}

async function runAuditTool(input: z.infer<typeof ToolInputs.run_audit>, ctx: ToolCtx): Promise<ToolOutcome> {
  const { services, locale } = ctx;
  const en = locale === 'en';
  const rate = en ? 'Audit limit reached for now.' : 'Se ha alcanzado el límite de auditorías por ahora.';
  // Same buckets as the audit form: the chat is not a way around them.
  const ipHit = await services.limiter.hit(`audit:ip:${ctx.ipHash}`, LIMITS.perIp.limit, LIMITS.perIp.windowMs);
  if (!ipHit.ok) return ok(AuditToolOutput, { ok: false, error: 'rate_limited', mensaje: rate });

  const deadline = ctx.now() + ctx.config.auditBudgetMs;
  const res = await analyzeSite({ url: input.url, sector: input.sector ?? 'otro', locale, deadline, now: ctx.now }, services, ctx.fetchOptions);
  if (!res.ok) {
    const mensaje =
      res.code === 'bad_url'
        ? en ? "That address can't be analyzed. Ask for the public website URL." : 'Esa dirección no se puede analizar. Pide la URL pública de la web.'
        : res.code === 'fetch_failed'
          ? en ? "The site didn't load from our server (down, blocking bots or too slow)." : 'La web no cargó desde nuestro servidor (caída, bloquea bots o va muy lenta).'
          : en ? 'The analysis took too long.' : 'El análisis ha tardado demasiado.';
    return ok(AuditToolOutput, { ok: false, error: res.code, mensaje });
  }
  const domHit = await services.limiter.hit(`audit:domain:${res.domain}`, LIMITS.perDomain.limit, LIMITS.perDomain.windowMs);
  if (!domHit.ok) return ok(AuditToolOutput, { ok: false, error: 'rate_limited', mensaje: rate });

  let auditId: string | null = null;
  try {
    auditId = await services.store.saveAudit({
      leadId: null,
      url: res.target.toString(),
      domain: res.domain,
      status: 'completed',
      signals: res.signals,
      report: res.report,
      error: null,
      ipHash: ctx.ipHash,
      locale,
    });
  } catch (e) {
    console.error('[chat] saveAudit failed', e);
  }
  ctx.state.audit = { id: auditId, url: res.signals.finalUrl, score: res.report.puntuacion_web };

  const data = {
    ok: true as const,
    url: res.signals.finalUrl,
    puntuacion_web: res.report.puntuacion_web,
    hallazgos: res.report.hallazgos.slice(0, 3).map((h) => ({ titulo: h.titulo, problema: h.problema, solucion: h.solucion })),
  };
  const out = AuditToolOutput.parse(data) as typeof data;
  return { content: JSON.stringify(out), ui: [{ kind: 'audit', data: out }] };
}

async function saveLeadTool(input: z.infer<typeof ToolInputs.save_lead>, ctx: ToolCtx): Promise<ToolOutcome> {
  // Hard gate: without the checkbox nothing personal is stored, whatever the model says.
  if (!ctx.req.consent) {
    return fail('consent_required', 'El usuario no ha marcado la casilla de privacidad. Pídele que la marque; no guardes nada.', [{ kind: 'consent' }]);
  }
  if (!userTyped(input.email, ctx.userTexts)) {
    return fail('email_not_provided', 'Ese email no lo ha escrito el usuario. Pídeselo; no lo inventes.');
  }
  if (ctx.state.lead && ctx.state.lead.email === input.email) {
    return ok(SimpleOutput, { ok: true, mensaje: 'Ya estaba guardado.' });
  }

  const { services, config, state, locale } = ctx;
  const leadId = await services.store.saveLead({
    source: 'chat',
    email: input.email,
    name: input.nombre,
    company: input.empresa ?? null,
    website: state.audit?.url ?? null,
    sector: input.sector ?? null,
    message: input.problema ?? null,
    locale,
    consent: true,
    meta: {
      urgencia: input.urgencia ?? null,
      presupuesto: input.presupuesto ?? null,
      resumen: input.resumen,
      puntuacion: input.puntuacion,
      audit_id: state.audit?.id ?? null,
      chat_session: ctx.req.sessionId,
      trigger: ctx.req.trigger,
      attribution: sanitizeAttribution(ctx.req.attribution) ?? null,
    },
  });
  state.lead = { id: leadId, name: input.nombre, email: input.email };

  const tasks: Promise<unknown>[] = [];
  if (input.puntuacion >= config.leadScoreThreshold) {
    const title = `🔥 Lead del chat (${input.puntuacion}/100) — ${input.empresa ?? input.nombre}`;
    const lines = [
      `${input.nombre} <${input.email}>${input.sector ? ` · ${input.sector}` : ''}`,
      [input.problema && `Problema: ${input.problema}`, input.urgencia && `Urgencia: ${input.urgencia}`, input.presupuesto && `Presupuesto: ${input.presupuesto}`].filter(Boolean).join(' · '),
      input.resumen,
      state.audit ? `Auditó ${state.audit.url} (${state.audit.score}/100)` : '',
    ].filter(Boolean);
    const link = state.audit?.id ? services.store.auditLink(state.audit.id) : undefined;
    tasks.push(...services.notifiers.map((n) => n.notify({ title, lines, link })));
  }
  if (state.audit?.id) {
    tasks.push(
      services.store.getAudit(state.audit.id).then(async (a) => {
        if (!a?.report) return;
        const mail = auditReportEmail({ report: a.report, url: a.url, name: input.nombre, email: input.email, locale, bookingUrl: config.bookingUrl });
        await services.email.send({ to: [input.email], subject: mail.subject, html: mail.html, text: mail.text, replyTo: config.salesEmail });
      }),
    );
  }
  const settled = await Promise.allSettled(tasks);
  settled.forEach((r) => r.status === 'rejected' && console.error('[chat] lead delivery failed', r.reason));

  return ok(
    SimpleOutput,
    { ok: true, mensaje: state.audit?.id ? 'Lead guardado. El informe completo sale por email ahora.' : 'Lead guardado.' },
    [{ kind: 'lead', puntuacion: input.puntuacion }],
  );
}
