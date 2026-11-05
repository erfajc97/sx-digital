/* Orchestrates one audit: validate → rate limit → save lead → fetch →
   signals → LLM → save audit → emails/alerts. Any failure after the lead is
   saved still answers with a friendly message offering the call. */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { sanitizeAttribution } from '../analytics/attribution';
import { config } from './env';
import { auditReportEmail, bookingLink } from './email-templates';
import { LlmError } from './llm';
import { normalizeTargetUrl, UrlPolicyError } from './net/ip-policy';
import { safeFetch, SafeFetchError, type SafeFetchOptions } from './net/safe-fetch';
import { publicView, type AuditReport } from './report-schema';
import { extractSignals, summarizeText, type Signals } from './signals';
import type { AuditStatus, Locale, Services } from './types';

export const SECTORES = [
  'restauracion',
  'salud_bienestar',
  'belleza_estetica',
  'retail_ecommerce',
  'inmobiliaria',
  'servicios_profesionales',
  'educacion',
  'turismo_hosteleria',
  'construccion_reformas',
  'tecnologia_saas',
  'finanzas_seguros',
  'otro',
] as const;

export const AuditInputSchema = z.object({
  url: z.string().trim().min(4).max(2048),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  sector: z.enum(SECTORES),
  consent: z.preprocess((v) => v === true || v === 'true' || v === 'on' || v === '1', z.literal(true)),
  locale: z.enum(['es', 'en']).default('es'),
  /** Honeypot — must stay empty. */
  company_site: z.string().max(500).optional().default(''),
  /** UTM / referrer of the visit (see src/lib/analytics/attribution.ts). */
  attribution: z.unknown().optional(),
});
export type AuditInput = z.infer<typeof AuditInputSchema>;

export const LIMITS = {
  perIp: { limit: 3, windowMs: 60 * 60 * 1000 },
  perDomain: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
};

export type AuditResponse =
  | {
      status: 'ok';
      auditId: string | null;
      result: ReturnType<typeof publicView>;
      bookingUrl: string;
    }
  | { status: 'partial'; message: string; bookingUrl: string }
  | { status: 'rate_limited'; message: string; retryAfterSec: number }
  | { status: 'invalid'; message: string; field?: string };

const MSG = {
  es: {
    invalid: 'Revisa los datos del formulario.',
    badUrl: 'Esa URL no es válida o no se puede analizar. Usa la dirección pública de tu web (https://…).',
    rate: 'Has alcanzado el límite de auditorías por ahora. Inténtalo más tarde o reserva una llamada y la hacemos juntos.',
    fetch: 'No hemos podido cargar tu web desde nuestro servidor (puede estar caída, bloquear bots o tardar demasiado). Hemos guardado tu solicitud: reserva una llamada de 30 min y la revisamos contigo en directo.',
    llm: 'Hemos analizado tu web, pero el informe tardó más de lo normal. Lo revisaremos a mano y te escribimos; si quieres ir más rápido, reserva una llamada de 30 min.',
  },
  en: {
    invalid: 'Please check the form fields.',
    badUrl: "That URL isn't valid or can't be analyzed. Use your website's public address (https://…).",
    rate: "You've reached the audit limit for now. Try again later, or book a call and we'll do it together.",
    fetch: "We couldn't load your website from our server (it may be down, blocking bots or too slow). We've saved your request — book a 30-min call and we'll review it with you live.",
    llm: "We analyzed your website, but the report took longer than usual. We'll review it manually and email you; to go faster, book a 30-min call.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function hashIp(ip: string) {
  return createHash('sha256').update(`${config.ipHashSalt}:${ip}`).digest('hex').slice(0, 32);
}

export function registrableDomain(host: string) {
  return host.toLowerCase().replace(/^www\./, '');
}

export interface RunAuditDeps {
  services: Services;
  ip: string;
  now?: () => number;
  fetchOptions?: SafeFetchOptions;
}

export async function runAudit(rawInput: unknown, deps: RunAuditDeps): Promise<AuditResponse> {
  const { services } = deps;
  const now = deps.now ?? Date.now;
  const started = now();
  const deadline = started + config.auditBudgetMs;

  const parsed = AuditInputSchema.safeParse(rawInput);
  const locale: Locale =
    rawInput && typeof rawInput === 'object' && (rawInput as { locale?: unknown }).locale === 'en' ? 'en' : 'es';
  const m = MSG[locale];
  if (!parsed.success) {
    return { status: 'invalid', message: m.invalid, field: String(parsed.error.issues[0]?.path[0] ?? '') };
  }
  const input = parsed.data;
  const bookingUrl = bookingLink(config.bookingUrl, input.email, input.name);

  // Honeypot: pretend success, store nothing.
  if (input.company_site) return { status: 'partial', message: m.fetch, bookingUrl };

  let target: URL;
  try {
    target = normalizeTargetUrl(input.url, deps.fetchOptions);
  } catch (e) {
    if (e instanceof UrlPolicyError) return { status: 'invalid', message: m.badUrl, field: 'url' };
    throw e;
  }
  const domain = registrableDomain(target.hostname);
  const ipHash = hashIp(deps.ip);

  const ipHit = await services.limiter.hit(`audit:ip:${ipHash}`, LIMITS.perIp.limit, LIMITS.perIp.windowMs);
  if (!ipHit.ok) return { status: 'rate_limited', message: m.rate, retryAfterSec: ipHit.retryAfterSec };
  const domHit = await services.limiter.hit(`audit:domain:${domain}`, LIMITS.perDomain.limit, LIMITS.perDomain.windowMs);
  if (!domHit.ok) return { status: 'rate_limited', message: m.rate, retryAfterSec: domHit.retryAfterSec };

  // 1) The lead is saved before anything that can fail.
  let leadId: string | null = null;
  try {
    leadId = await services.store.saveLead({
      source: 'audit',
      email: input.email,
      name: input.name,
      website: target.toString(),
      sector: input.sector,
      locale,
      consent: true,
      meta: { attribution: sanitizeAttribution(input.attribution) ?? null },
    });
  } catch (e) {
    console.error('[audit] saveLead failed', e);
  }

  const saveAudit = async (status: AuditStatus, signals: Signals | null, report: AuditReport | null, error: string | null) => {
    try {
      return await services.store.saveAudit({ leadId, url: target.toString(), domain, status, signals, report, error, ipHash, locale });
    } catch (e) {
      console.error('[audit] saveAudit failed', e);
      return null;
    }
  };

  const alertSales = async (title: string, lines: string[], auditId: string | null) => {
    const link = auditId ? services.store.auditLink(auditId) : undefined;
    const results = await Promise.allSettled(services.notifiers.map((n) => n.notify({ title, lines, link })));
    results.forEach((r) => r.status === 'rejected' && console.error('[audit] notify failed', r.reason));
  };

  // 2) Fetch the target site.
  let signals: Signals;
  let text: string;
  try {
    const page = await safeFetch(target, { timeoutMs: 8_000, maxBytes: 2 * 1024 * 1024, maxRedirects: 3, ...deps.fetchOptions });
    ({ signals, text } = extractSignals(page.body, {
      url: page.url,
      finalUrl: page.finalUrl,
      status: page.status,
      responseMs: page.responseMs,
      truncated: page.truncated,
    }));
  } catch (e) {
    const code = e instanceof SafeFetchError ? e.code : 'network';
    await saveAudit('fetch_failed', null, null, code);
    if (code === 'blocked' || code === 'invalid_url') return { status: 'invalid', message: m.badUrl, field: 'url' };
    return { status: 'partial', message: m.fetch, bookingUrl };
  }

  // 3) AI analysis inside the remaining time budget (keep ~3 s for storage + email).
  let report: AuditReport;
  try {
    const timeoutMs = Math.max(5_000, deadline - now() - 3_000);
    report = await services.llm.analyze(
      { url: signals.finalUrl, sector: input.sector, locale, signals, visibleText: summarizeText(text) },
      { timeoutMs },
    );
  } catch (e) {
    const code = e instanceof LlmError ? e.code : 'llm_error';
    console.error('[audit] llm failed', code, e instanceof Error ? e.message : e);
    const auditId = await saveAudit('llm_failed', signals, null, code);
    await alertSales(
      `Auditoría sin informe IA (${code}) — ${domain}`,
      [`${input.name} <${input.email}> · ${input.sector}`, `Web: ${target.toString()}`, 'Revisar a mano: el lead está guardado con las señales.'],
      auditId,
    );
    return { status: 'partial', message: m.llm, bookingUrl };
  }

  // 4) Persist + deliver.
  const auditId = await saveAudit('completed', signals, report, null);
  const mail = auditReportEmail({ report, url: signals.finalUrl, name: input.name, email: input.email, locale, bookingUrl: config.bookingUrl });
  const tasks: Promise<unknown>[] = [
    services.email.send({ to: [input.email], subject: mail.subject, html: mail.html, text: mail.text, replyTo: config.salesEmail }),
  ];
  if (report.lead_score >= config.leadScoreThreshold) {
    tasks.push(
      alertSales(
        `🔥 Lead caliente (${report.lead_score}/100) — ${report.negocio_detectado}`,
        [
          `${input.name} <${input.email}> · ${report.sector}`,
          `Web: ${signals.finalUrl} · Puntuación web: ${report.puntuacion_web}/100`,
          report.resumen_para_ventas,
        ],
        auditId,
      ),
    );
  }
  const delivered = await Promise.allSettled(tasks);
  delivered.forEach((r) => r.status === 'rejected' && console.error('[audit] delivery failed', r.reason));

  return { status: 'ok', auditId, result: publicView(report), bookingUrl };
}
