/* Lead attribution (where a visitor came from). Captured in the browser for
   the current visit and sent along with form submissions, then stored in
   leads.meta.attribution. Pure + shared by client and server. */
import { z } from 'zod';

export const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
  'ttclid',
  'li_fat_id',
] as const;

const short = z.string().trim().max(200).optional();

export const AttributionSchema = z
  .object({
    utm_source: short,
    utm_medium: short,
    utm_campaign: short,
    utm_term: short,
    utm_content: short,
    gclid: short,
    fbclid: short,
    msclkid: short,
    ttclid: short,
    li_fat_id: short,
    referrer: z.string().trim().max(500).optional(),
    landing: z.string().trim().max(500).optional(),
    channel: z.string().trim().max(40).optional(),
    analytics_id: z.string().trim().max(120).optional(),
    first_seen: z.string().trim().max(40).optional(),
  })
  .partial();

export type Attribution = z.infer<typeof AttributionSchema>;

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|brave)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|linkedin|lnkd|t\.co|twitter|x\.com|tiktok|youtube|pinterest|reddit|whatsapp)\./i;
const AI = /(^|\.)(chatgpt|openai|perplexity|claude|gemini|copilot)\./i;

/** Groups a visit into a coarse channel for reporting. */
export function channelFor(a: Attribution, ownHost?: string): string {
  if (a.gclid || a.msclkid) return 'paid_search';
  if (a.fbclid || a.ttclid || a.li_fat_id) return 'paid_social';
  const medium = (a.utm_medium ?? '').toLowerCase();
  if (medium) {
    if (/cpc|ppc|paid|ads?/.test(medium)) return /social|meta|facebook|instagram|tiktok|linkedin/.test(`${medium} ${a.utm_source ?? ''}`.toLowerCase()) ? 'paid_social' : 'paid_search';
    if (/email|newsletter/.test(medium)) return 'email';
    if (/social/.test(medium)) return 'social';
    return medium.slice(0, 40);
  }
  if (a.utm_source) return 'campaign';
  if (!a.referrer) return 'direct';
  let host = '';
  try {
    host = new URL(a.referrer).hostname.toLowerCase();
  } catch {
    return 'referral';
  }
  if (ownHost && (host === ownHost || host.endsWith(`.${ownHost}`))) return 'direct';
  if (AI.test(host)) return 'ai_search';
  if (SEARCH.test(host)) return 'organic_search';
  if (SOCIAL.test(host)) return 'social';
  return 'referral';
}

/** Reads campaign params + referrer from a landing. Returns null when the
    visit carries no attribution worth recording (internal navigation). */
export function attributionFromLanding(href: string, referrer: string, nowIso: string): Attribution | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const out: Attribution = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = url.searchParams.get(k);
    if (v) (out as Record<string, string>)[k] = v.slice(0, 200);
  }
  let externalRef = '';
  if (referrer) {
    try {
      const r = new URL(referrer);
      if (r.hostname !== url.hostname) externalRef = `${r.origin}${r.pathname}`.slice(0, 500);
    } catch {
      /* ignore malformed referrer */
    }
  }
  if (externalRef) out.referrer = externalRef;
  out.landing = url.pathname.slice(0, 500);
  out.first_seen = nowIso;
  out.channel = channelFor(out, url.hostname);
  return out;
}

/** Server-side: accept an attribution object or its JSON string; drop junk. */
export function sanitizeAttribution(raw: unknown): Attribution | undefined {
  let v = raw;
  if (typeof raw === 'string') {
    if (raw.length > 4000) return undefined;
    try {
      v = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  const parsed = AttributionSchema.safeParse(v);
  if (!parsed.success) return undefined;
  const clean = Object.fromEntries(Object.entries(parsed.data).filter(([, x]) => typeof x === 'string' && x !== ''));
  return Object.keys(clean).length ? (clean as Attribution) : undefined;
}
