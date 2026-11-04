/* Shared types + service interfaces for the lead pipeline (audit, contact
   form, Cal.com bookings). Every external service sits behind an interface so
   development works without keys (mock implementations in ./services.ts). */
import type { AuditReport } from './report-schema';
import type { Signals } from './signals';

export type LeadSource = 'audit' | 'contact' | 'calcom';
export type Locale = 'es' | 'en';

export interface LeadInput {
  source: LeadSource;
  email: string;
  name?: string | null;
  company?: string | null;
  website?: string | null;
  sector?: string | null;
  message?: string | null;
  locale?: Locale;
  consent?: boolean;
  /** Free-form extra data (booking uid, project type, …). */
  meta?: Record<string, unknown>;
}

export type AuditStatus = 'completed' | 'fetch_failed' | 'llm_failed';

export interface AuditRecord {
  leadId: string | null;
  url: string;
  domain: string;
  status: AuditStatus;
  signals: Signals | null;
  report: AuditReport | null;
  error: string | null;
  ipHash: string | null;
  locale: Locale;
}

/* ---------------------------- service interfaces ---------------------------- */

export interface LlmAuditInput {
  url: string;
  sector: string;
  locale: Locale;
  signals: Signals;
  visibleText: string;
}

export interface ILLM {
  readonly name: string;
  /** Returns a validated report or throws. `timeoutMs` is a hard ceiling. */
  analyze(input: LlmAuditInput, opts: { timeoutMs: number }): Promise<AuditReport>;
}

export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface IEmail {
  readonly name: string;
  send(msg: EmailMessage): Promise<void>;
}

export interface InternalAlert {
  title: string;
  lines: string[];
  link?: string;
}

export interface INotifier {
  readonly name: string;
  notify(alert: InternalAlert): Promise<void>;
}

export interface ILeadStore {
  readonly name: string;
  saveLead(lead: LeadInput): Promise<string>;
  saveAudit(audit: AuditRecord): Promise<string>;
  /** Link for the sales team to open a stored audit (dashboard / row). */
  auditLink(auditId: string): string | undefined;
}

export interface IRateLimiter {
  readonly name: string;
  /** Registers one hit for `key`; `ok:false` once `limit` hits exist inside `windowMs`. */
  hit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfterSec: number }>;
}

export interface Services {
  llm: ILLM;
  email: IEmail;
  /** Internal alert channels (Slack + sales inbox). */
  notifiers: INotifier[];
  store: ILeadStore;
  limiter: IRateLimiter;
}
