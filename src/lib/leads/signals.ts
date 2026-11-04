/* Deterministic signal extraction from a fetched page — no AI involved.
   These facts are what the LLM is allowed to base its findings on. */
import { parse, type HTMLElement } from 'node-html-parser';

export interface Signals {
  url: string;
  finalUrl: string;
  status: number | null;
  https: boolean;
  responseMs: number | null;
  truncated: boolean;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1: string[];
  h2: string[];
  lang: string | null;
  viewport: boolean;
  canonical: string | null;
  generator: string | null;
  wordCount: number;
  images: { total: number; missingAlt: number; emptyAlt: number };
  placeholders: { kind: string; sample: string }[];
  contact: {
    whatsapp: number;
    tel: number;
    mailto: number;
    forms: number;
    contactForms: number;
  };
  commerce: {
    stripe: boolean;
    calendly: boolean;
    calcom: boolean;
    bizum: boolean;
    paypal: boolean;
    cart: boolean;
    bookingCta: boolean;
  };
  structuredData: { jsonLdTypes: string[]; microdata: number };
  openGraph: { title: boolean; description: boolean; image: boolean };
  social: string[];
  englishVersion: boolean;
  analytics: string[];
}

export interface ExtractContext {
  url: string;
  finalUrl?: string;
  status?: number | null;
  responseMs?: number | null;
  truncated?: boolean;
}

const PLACEHOLDER_PATTERNS: { kind: string; re: RegExp }[] = [
  { kind: 'picsum', re: /picsum\.photos/i },
  { kind: 'unsplash_source', re: /source\.unsplash\.com/i },
  { kind: 'gtv_videos_bucket', re: /gtv-videos-bucket/i },
  { kind: 'placeholder_image', re: /(via\.)?placeholder\.com|placehold\.(co|it)|dummyimage\.com|placekitten\.com|loremflickr\.com|fakeimg\.pl/i },
  { kind: 'sample_video', re: /sample-videos\.com|samplelib\.com|big_buck_bunny|BigBuckBunny|ElephantsDream/i },
];

const SOCIAL: { name: string; re: RegExp }[] = [
  { name: 'instagram', re: /instagram\.com\//i },
  { name: 'facebook', re: /facebook\.com\/|fb\.me\//i },
  { name: 'linkedin', re: /linkedin\.com\//i },
  { name: 'tiktok', re: /tiktok\.com\//i },
  { name: 'youtube', re: /youtube\.com\/|youtu\.be\//i },
  { name: 'x', re: /(?:^|\/\/)(?:www\.)?(?:twitter|x)\.com\//i },
  { name: 'pinterest', re: /pinterest\.[a-z.]+\//i },
];

const ANALYTICS: { name: string; re: RegExp }[] = [
  { name: 'google_analytics', re: /googletagmanager\.com\/gtag|google-analytics\.com|gtag\(/i },
  { name: 'google_tag_manager', re: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/ },
  { name: 'meta_pixel', re: /connect\.facebook\.net\/[^"']*fbevents\.js|fbq\(/i },
  { name: 'tiktok_pixel', re: /analytics\.tiktok\.com/i },
  { name: 'hotjar', re: /static\.hotjar\.com/i },
];

const clean = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

function collectJsonLdTypes(node: unknown, out: Set<string>, depth = 0): void {
  if (depth > 6 || node == null) return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectJsonLdTypes(n, out, depth + 1));
    return;
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') out.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.add(x));
    if (obj['@graph']) collectJsonLdTypes(obj['@graph'], out, depth + 1);
  }
}

/** Visible page text (scripts/styles stripped, whitespace collapsed). */
export function visibleText(root: HTMLElement): string {
  const body = root.querySelector('body') ?? root;
  const copy = parse(body.toString());
  copy.querySelectorAll('script, style, noscript, svg, template, iframe').forEach((n) => n.remove());
  return clean(copy.textContent);
}

export function extractSignals(html: string, ctx: ExtractContext): { signals: Signals; text: string } {
  const root = parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true } });
  const finalUrl = ctx.finalUrl ?? ctx.url;
  let base: URL | null = null;
  try {
    base = new URL(finalUrl);
  } catch {
    base = null;
  }

  const meta = (sel: string) => root.querySelector(sel)?.getAttribute('content') ?? null;
  const title = clean(root.querySelector('title')?.textContent) || null;
  const metaDescription = clean(meta('meta[name="description"]') ?? meta('meta[name="Description"]')) || null;

  const text = visibleText(root);
  const words = text ? text.split(/\s+/).length : 0;

  /* images */
  const imgs = root.querySelectorAll('img');
  let missingAlt = 0;
  let emptyAlt = 0;
  for (const img of imgs) {
    const alt = img.getAttribute('alt');
    if (alt === undefined) missingAlt++;
    else if (alt.trim() === '') emptyAlt++;
  }

  /* all URLs referenced by media + links */
  const refs: string[] = [];
  root.querySelectorAll('img, source, video, audio, iframe, a, link, script, embed').forEach((el) => {
    for (const attr of ['src', 'srcset', 'href', 'poster', 'data-src', 'data-bg', 'data-background']) {
      const v = el.getAttribute(attr);
      if (v) refs.push(v);
    }
  });
  root.querySelectorAll('[style]').forEach((el) => {
    const m = (el.getAttribute('style') ?? '').match(/url\(([^)]+)\)/gi);
    if (m) refs.push(...m);
  });
  const refBlob = refs.join('\n');

  const placeholders: { kind: string; sample: string }[] = [];
  for (const p of PLACEHOLDER_PATTERNS) {
    const hit = refs.find((r) => p.re.test(r));
    if (hit) placeholders.push({ kind: p.kind, sample: hit.slice(0, 160) });
  }
  const lorem = text.match(/lorem ipsum[^.]{0,60}/i);
  if (lorem) placeholders.push({ kind: 'lorem_ipsum', sample: lorem[0] });

  /* contact methods */
  const hrefs = root.querySelectorAll('a[href]').map((a) => a.getAttribute('href') ?? '');
  const whatsapp = hrefs.filter((h) => /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com/i.test(h)).length;
  const tel = hrefs.filter((h) => /^tel:/i.test(h.trim())).length;
  const mailto = hrefs.filter((h) => /^mailto:/i.test(h.trim())).length;
  const forms = root.querySelectorAll('form');
  const contactForms = forms.filter((f) => {
    const role = (f.getAttribute('role') ?? '') + (f.getAttribute('action') ?? '');
    if (/search/i.test(role)) return false;
    return f.querySelector('input[type="email"], input[type="tel"], textarea, input[name*="mail" i]') !== null;
  }).length;

  /* booking / payments */
  const fullHtml = html.length > 400_000 ? html.slice(0, 400_000) : html;
  const linkTexts = root
    .querySelectorAll('a, button')
    .map((el) => clean(el.textContent).toLowerCase())
    .join(' | ');
  const commerce = {
    stripe: /js\.stripe\.com|buy\.stripe\.com|checkout\.stripe\.com/i.test(fullHtml),
    calendly: /calendly\.com/i.test(fullHtml),
    calcom: /(?:app\.)?cal\.com\/|cal\.com\/embed/i.test(fullHtml),
    bizum: /bizum/i.test(text) || /bizum/i.test(refBlob),
    paypal: /paypal\.com|paypalobjects\.com/i.test(fullHtml),
    cart: /woocommerce|cdn\.shopify\.com|shopify\.theme|add[-_]to[-_]cart|\/cart\b|\/carrito\b|\bcarrito\b/i.test(fullHtml),
    bookingCta: /\b(reserva(r)?|pedir cita|book now|book a|agenda(r)?|appointment|cita previa)\b/i.test(linkTexts),
  };

  /* structured data */
  const jsonLdTypes = new Set<string>();
  root.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      collectJsonLdTypes(JSON.parse(s.textContent), jsonLdTypes);
    } catch {
      /* invalid JSON-LD is itself a finding, but we only report types */
    }
  });
  const microdata = root.querySelectorAll('[itemtype]').length;

  /* Open Graph */
  const og = (p: string) => Boolean(root.querySelector(`meta[property="og:${p}"]`)?.getAttribute('content'));

  /* social */
  const social = SOCIAL.filter((s) => hrefs.some((h) => s.re.test(h))).map((s) => s.name);

  /* English version */
  const lang = root.querySelector('html')?.getAttribute('lang')?.trim() || null;
  const hreflangEn = root
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .some((l) => /^en\b/i.test(l.getAttribute('hreflang') ?? ''));
  const enLink = hrefs.some((h) => {
    try {
      const u = new URL(h, base ?? undefined);
      return (!base || u.hostname === base.hostname) && /^\/en(\/|$)|[?&]lang=en\b/i.test(u.pathname + u.search);
    } catch {
      return false;
    }
  });
  const englishVersion = hreflangEn || enLink || /^en\b/i.test(lang ?? '');

  const analytics = ANALYTICS.filter((a) => a.re.test(fullHtml)).map((a) => a.name);

  const signals: Signals = {
    url: ctx.url,
    finalUrl,
    status: ctx.status ?? null,
    https: base?.protocol === 'https:',
    responseMs: ctx.responseMs ?? null,
    truncated: Boolean(ctx.truncated),
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1: root.querySelectorAll('h1').map((h) => clean(h.textContent)).filter(Boolean).slice(0, 5),
    h2: root.querySelectorAll('h2').map((h) => clean(h.textContent)).filter(Boolean).slice(0, 12),
    lang,
    viewport: Boolean(root.querySelector('meta[name="viewport"]')),
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    generator: meta('meta[name="generator"]'),
    wordCount: words,
    images: { total: imgs.length, missingAlt, emptyAlt },
    placeholders,
    contact: { whatsapp, tel, mailto, forms: forms.length, contactForms },
    commerce,
    structuredData: { jsonLdTypes: [...jsonLdTypes].slice(0, 20), microdata },
    openGraph: { title: og('title'), description: og('description'), image: og('image') },
    social,
    englishVersion,
    analytics,
  };
  return { signals, text };
}

/** ~4 chars per token → keep the visible text inside the prompt budget. */
export function summarizeText(text: string, maxChars = 16_000): string {
  if (text.length <= maxChars) return text;
  const head = text.slice(0, Math.floor(maxChars * 0.75));
  const tail = text.slice(-Math.floor(maxChars * 0.2));
  return `${head}\n[…texto recortado…]\n${tail}`;
}
