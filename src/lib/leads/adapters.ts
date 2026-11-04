/* Concrete implementations of IEmail, INotifier, ILeadStore, IRateLimiter
   (real + in-memory/console mocks for local development). */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { internalEmail } from './email-templates';
import type {
  AuditRecord,
  EmailMessage,
  IEmail,
  ILeadStore,
  INotifier,
  InternalAlert,
  IRateLimiter,
  LeadInput,
} from './types';

/* ---------------------------------- email ---------------------------------- */

export class ResendEmail implements IEmail {
  readonly name = 'resend';
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(msg: EmailMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) throw new Error(`resend_${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  }
}

export class ConsoleEmail implements IEmail {
  readonly name = 'console';
  readonly sent: EmailMessage[] = [];
  async send(msg: EmailMessage): Promise<void> {
    this.sent.push(msg);
    console.info(`[mock-email] → ${msg.to.join(', ')} · ${msg.subject}`);
  }
}

/* -------------------------------- notifiers -------------------------------- */

export class SlackNotifier implements INotifier {
  readonly name = 'slack';
  constructor(private readonly webhookUrl: string) {}
  async notify(alert: InternalAlert): Promise<void> {
    const text = [`*${alert.title}*`, ...alert.lines, alert.link ? `<${alert.link}|Abrir auditoría>` : '']
      .filter(Boolean)
      .join('\n');
    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`slack_${res.status}`);
  }
}

export class EmailNotifier implements INotifier {
  readonly name: string;
  constructor(
    private readonly email: IEmail,
    private readonly to: string,
  ) {
    this.name = `email:${email.name}`;
  }
  async notify(alert: InternalAlert): Promise<void> {
    const { html, text } = internalEmail(alert.title, alert.lines, alert.link);
    await this.email.send({ to: [this.to], subject: alert.title, html, text });
  }
}

export class ConsoleNotifier implements INotifier {
  readonly name = 'console';
  readonly alerts: InternalAlert[] = [];
  async notify(alert: InternalAlert): Promise<void> {
    this.alerts.push(alert);
    console.info(`[mock-notify] ${alert.title}\n  ${alert.lines.join('\n  ')}`);
  }
}

/* ---------------------------------- store ---------------------------------- */

export class SupabaseLeadStore implements ILeadStore {
  readonly name = 'supabase';
  private db: SupabaseClient;
  private projectRef: string | null;

  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    this.projectRef = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ?? null;
  }

  async saveLead(lead: LeadInput): Promise<string> {
    const { data, error } = await this.db
      .from('leads')
      .insert({
        source: lead.source,
        email: lead.email.toLowerCase(),
        name: lead.name ?? null,
        company: lead.company ?? null,
        website: lead.website ?? null,
        sector: lead.sector ?? null,
        message: lead.message ?? null,
        locale: lead.locale ?? 'es',
        consent: lead.consent ?? false,
        consent_at: lead.consent ? new Date().toISOString() : null,
        meta: lead.meta ?? {},
      })
      .select('id')
      .single();
    if (error) throw new Error(`supabase_lead: ${error.message}`);
    return data.id as string;
  }

  async saveAudit(a: AuditRecord): Promise<string> {
    const { data, error } = await this.db
      .from('audits')
      .insert({
        lead_id: a.leadId,
        url: a.url,
        domain: a.domain,
        status: a.status,
        signals: a.signals,
        report: a.report,
        puntuacion_web: a.report?.puntuacion_web ?? null,
        lead_score: a.report?.lead_score ?? null,
        error: a.error,
        ip_hash: a.ipHash,
        locale: a.locale,
      })
      .select('id')
      .single();
    if (error) throw new Error(`supabase_audit: ${error.message}`);
    return data.id as string;
  }

  auditLink(auditId: string) {
    if (!this.projectRef) return undefined;
    // Opens the audits table in Supabase Studio; filter by id there.
    return `https://supabase.com/dashboard/project/${this.projectRef}/editor?schema=public&table=audits&filter=id%3Aeq%3A${auditId}`;
  }

  /** Rate-limit bucket shared across all function instances. */
  async countAndInsertHit(key: string, windowMs: number): Promise<{ count: number; oldest: string | null }> {
    const since = new Date(Date.now() - windowMs).toISOString();
    const ins = await this.db.from('rate_limit_hits').insert({ key });
    if (ins.error) throw new Error(`supabase_rl: ${ins.error.message}`);
    const { data, count, error } = await this.db
      .from('rate_limit_hits')
      .select('created_at', { count: 'exact' })
      .eq('key', key)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(1);
    if (error) throw new Error(`supabase_rl: ${error.message}`);
    return { count: count ?? 0, oldest: (data?.[0]?.created_at as string | undefined) ?? null };
  }
}

export class MemoryLeadStore implements ILeadStore {
  readonly name = 'memory';
  readonly leads: (LeadInput & { id: string })[] = [];
  readonly audits: (AuditRecord & { id: string })[] = [];
  async saveLead(lead: LeadInput) {
    const id = crypto.randomUUID();
    this.leads.push({ ...lead, id });
    console.info(`[mock-store] lead ${lead.source} ${lead.email} → ${id}`);
    return id;
  }
  async saveAudit(audit: AuditRecord) {
    const id = crypto.randomUUID();
    this.audits.push({ ...audit, id });
    console.info(`[mock-store] audit ${audit.status} ${audit.domain} → ${id}`);
    return id;
  }
  auditLink(id: string) {
    return `http://localhost:4321/#audit-${id}`;
  }
}

/* ------------------------------- rate limiting ------------------------------ */

/** Sliding window in process memory (per function instance / dev server). */
export class MemoryRateLimiter implements IRateLimiter {
  readonly name = 'memory';
  private hits = new Map<string, number[]>();
  constructor(private readonly now: () => number = Date.now) {}

  async hit(key: string, limit: number, windowMs: number) {
    const t = this.now();
    const list = (this.hits.get(key) ?? []).filter((ts) => ts > t - windowMs);
    if (list.length >= limit) {
      this.hits.set(key, list);
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((list[0] + windowMs - t) / 1000)) };
    }
    list.push(t);
    this.hits.set(key, list);
    if (this.hits.size > 5_000) {
      for (const [k, v] of this.hits) if (!v.some((ts) => ts > t - windowMs)) this.hits.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  }
}

/** Durable limiter backed by Supabase, with the memory limiter in front so a
    burst on one warm instance is cut before touching the database. */
export class SupabaseRateLimiter implements IRateLimiter {
  readonly name = 'supabase';
  private local = new MemoryRateLimiter();
  constructor(private readonly store: SupabaseLeadStore) {}

  async hit(key: string, limit: number, windowMs: number) {
    const local = await this.local.hit(key, limit, windowMs);
    if (!local.ok) return local;
    try {
      const { count, oldest } = await this.store.countAndInsertHit(key, windowMs);
      if (count > limit) {
        const retry = oldest ? Math.ceil((new Date(oldest).getTime() + windowMs - Date.now()) / 1000) : 3600;
        return { ok: false, retryAfterSec: Math.max(1, retry) };
      }
    } catch (e) {
      console.error('[rate-limit] supabase unavailable, using memory only', e);
    }
    return { ok: true, retryAfterSec: 0 };
  }
}
