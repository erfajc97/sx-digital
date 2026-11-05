/* Locale plumbing: one dictionary per language (same export shape), a route
   map between counterpart pages, and helpers for hreflang + the switcher. */
import * as es from '@/data/site';
import * as en from '@/data/site.en';

export type Locale = 'es' | 'en';

export const locales: Locale[] = ['es', 'en'];
export const defaultLocale: Locale = 'es';

export function getDict(locale: string | undefined) {
  return locale === 'en' ? en : es;
}

/* Counterpart paths (translated slugs). Keys = Spanish (default) routes. */
export const routePairs: Record<string, string> = {
  '/': '/en/',
  '/nosotros': '/en/about',
  '/preguntas': '/en/faq',
  '/agendar': '/en/book',
  '/auditoria': '/en/audit',
  '/auditoria/resultado': '/en/audit/result',
  '/privacidad': '/en/privacy',
};

const normalize = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);

/* Pages are built as folders (/nosotros/index.html), so the canonical URL ends
   in "/". Links and hreflang must use that form: "/nosotros" 301-redirects,
   and Google ignores hreflang that points at a redirect. */
export const withSlash = (p: string) => (p.endsWith('/') ? p : `${p}/`);

/** The same page in the other locale (used by hreflang + language switcher). */
export function altPathFor(pathname: string, target: Locale): string | undefined {
  const path = normalize(pathname);
  if (target === 'en') {
    const hit = routePairs[path === '' ? '/' : path];
    return hit ? withSlash(hit) : undefined;
  }
  const hit = Object.entries(routePairs).find(([, enPath]) => normalize(enPath) === path);
  return hit ? withSlash(hit[0]) : undefined;
}
