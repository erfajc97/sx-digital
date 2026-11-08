/* Fetch → signals → AI report for one public URL. Shared by the audit form
   (runAudit) and the Solvy chat (run_audit tool), so both produce the same
   report, hit the same rate-limit buckets and store audits the same way. */
import { LlmError } from './llm';
import { normalizeTargetUrl, UrlPolicyError } from './net/ip-policy';
import { safeFetch, SafeFetchError, type SafeFetchOptions } from './net/safe-fetch';
import type { AuditReport } from './report-schema';
import { extractSignals, summarizeText, type Signals } from './signals';
import type { Locale, Services } from './types';

export type AnalysisResult =
  | { ok: true; target: URL; domain: string; signals: Signals; report: AuditReport }
  | { ok: false; code: 'bad_url' | 'fetch_failed' | 'llm_failed'; target?: URL; domain?: string; signals?: Signals; error: string };

export function registrableDomain(host: string) {
  return host.toLowerCase().replace(/^www\./, '');
}

/** Validates the URL against the SSRF policy. Throws UrlPolicyError. */
export function resolveTarget(rawUrl: string, fetchOptions?: SafeFetchOptions) {
  const target = normalizeTargetUrl(rawUrl, fetchOptions);
  return { target, domain: registrableDomain(target.hostname) };
}

export async function analyzeSite(
  args: { url: string | URL; sector: string; locale: Locale; deadline: number; now?: () => number },
  services: Pick<Services, 'llm'>,
  fetchOptions?: SafeFetchOptions,
): Promise<AnalysisResult> {
  const now = args.now ?? Date.now;
  let target: URL;
  let domain: string;
  try {
    ({ target, domain } = typeof args.url === 'string' ? resolveTarget(args.url, fetchOptions) : { target: args.url, domain: registrableDomain(args.url.hostname) });
  } catch (e) {
    if (e instanceof UrlPolicyError) return { ok: false, code: 'bad_url', error: 'invalid_url' };
    throw e;
  }

  let signals: Signals;
  let text: string;
  try {
    const page = await safeFetch(target, { timeoutMs: 8_000, maxBytes: 2 * 1024 * 1024, maxRedirects: 3, ...fetchOptions });
    ({ signals, text } = extractSignals(page.body, {
      url: page.url,
      finalUrl: page.finalUrl,
      status: page.status,
      responseMs: page.responseMs,
      truncated: page.truncated,
    }));
  } catch (e) {
    const code = e instanceof SafeFetchError ? e.code : 'network';
    if (code === 'blocked' || code === 'invalid_url') return { ok: false, code: 'bad_url', target, domain, error: code };
    return { ok: false, code: 'fetch_failed', target, domain, error: code };
  }

  try {
    // Keep ~3 s for storage + email after the model answers.
    const timeoutMs = Math.max(5_000, args.deadline - now() - 3_000);
    const report = await services.llm.analyze(
      { url: signals.finalUrl, sector: args.sector, locale: args.locale, signals, visibleText: summarizeText(text) },
      { timeoutMs },
    );
    return { ok: true, target, domain, signals, report };
  } catch (e) {
    const code = e instanceof LlmError ? e.code : 'llm_error';
    console.error('[analysis] llm failed', code, e instanceof Error ? e.message : e);
    return { ok: false, code: 'llm_failed', target, domain, signals, error: code };
  }
}
