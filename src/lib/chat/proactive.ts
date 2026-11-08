/* When Solvy may open on its own. Pure (no DOM) so it is unit-tested; the
   browser loader feeds it the observed state. Rules:
   - 40 s cumulative with the #planes section in view      → proactive_pricing
   - audit form touched and not submitted within 60 s      → form_abandon
   - visit landed with an ads utm_source (or a click id)   → ads
   At most once per session, and never again after the visitor closes it. */

export type ProactiveTrigger = 'proactive_pricing' | 'form_abandon' | 'ads';

export const PRICING_DWELL_MS = 40_000;
export const FORM_ABANDON_MS = 60_000;
/** Ads visitors get a few seconds to look at the page first. */
export const ADS_DELAY_MS = 8_000;

const AD_SOURCES = /^(google|googleads|adwords|gads|meta|facebook|fb|instagram|ig|tiktok|linkedin|bing|microsoft|youtube|twitter|x|pinterest|reddit|snapchat)([_-]?ads?)?$/i;

export interface ProactiveInput {
  now: number;
  /** Already opened (by any means) or proactively shown this session. */
  shownThisSession: boolean;
  /** The visitor closed the chat this session. */
  dismissed: boolean;
  /** Something else is on screen (intro, cookie banner, contact modal). */
  blocked?: boolean;
  pricingDwellMs: number;
  formStartedAt: number | null;
  formSubmitted: boolean;
  landedAt: number;
  attribution: { utm_source?: string; utm_medium?: string; gclid?: string; fbclid?: string; msclkid?: string; ttclid?: string } | null;
}

export function isAdsVisit(a: ProactiveInput['attribution']): boolean {
  if (!a) return false;
  if (a.gclid || a.fbclid || a.msclkid || a.ttclid) return true;
  const src = (a.utm_source ?? '').trim();
  if (!src) return false;
  return AD_SOURCES.test(src) || /cpc|ppc|paid|ads?$/i.test(a.utm_medium ?? '');
}

export function decideProactive(s: ProactiveInput): ProactiveTrigger | null {
  if (s.shownThisSession || s.dismissed || s.blocked) return null;
  if (s.formStartedAt !== null && !s.formSubmitted && s.now - s.formStartedAt >= FORM_ABANDON_MS) return 'form_abandon';
  if (s.pricingDwellMs >= PRICING_DWELL_MS) return 'proactive_pricing';
  if (isAdsVisit(s.attribution) && s.now - s.landedAt >= ADS_DELAY_MS) return 'ads';
  return null;
}
