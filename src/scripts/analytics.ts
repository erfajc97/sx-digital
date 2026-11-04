/* Site analytics (browser).

   - PostHog EU, loaded lazily and only when PUBLIC_POSTHOG_KEY is set.
   - Until the visitor accepts cookies it runs cookieless (in-memory id, no
     session replay, nothing written to the device). After "Accept" it keeps a
     persistent id and records sessions with every input masked.
   - Pages and components report events via `track()` or by dispatching
     `sx:track` (CustomEvent<{ name, props }>) — no direct coupling.
   - Attribution (UTM / referrer) for the visit is kept in sessionStorage and
     attached to form submissions so each lead knows its channel. */
import { attributionFromLanding, type Attribution } from '@/lib/analytics/attribution';
import { classifyClick, newScrollMilestones, type EventName } from '@/lib/analytics/events';

type Props = Record<string, string | number | boolean>;
type Consent = 'granted' | 'denied' | null;
type PostHogLike = {
  capture: (name: string, props?: Props) => void;
  identify: (id: string, props?: Props) => void;
  get_distinct_id: () => string;
  set_config: (c: Record<string, unknown>) => void;
  startSessionRecording: () => void;
  stopSessionRecording: () => void;
  reset: () => void;
};

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined) || 'https://eu.i.posthog.com';
const CONSENT_KEY = 'sx-consent';
const ATTR_KEY = 'sx-attr';
const DEBUG = import.meta.env.DEV;

let ph: PostHogLike | null = null;
const queue: [EventName, Props][] = [];

/* ------------------------------- storage -------------------------------- */

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function getConsent(): Consent {
  const v = safe(() => localStorage.getItem(CONSENT_KEY), null);
  return v === 'granted' || v === 'denied' ? v : null;
}

export function getAttribution(): Attribution {
  const stored = safe(() => JSON.parse(sessionStorage.getItem(ATTR_KEY) || 'null') as Attribution | null, null) ?? {};
  const id = ph ? safe(() => ph!.get_distinct_id(), '') : '';
  return id ? { ...stored, analytics_id: id } : stored;
}

function captureAttribution() {
  // First landing of the visit wins; internal navigation never overwrites it.
  if (safe(() => sessionStorage.getItem(ATTR_KEY), 'x')) return;
  const a = attributionFromLanding(location.href, document.referrer, new Date().toISOString());
  if (a) safe(() => sessionStorage.setItem(ATTR_KEY, JSON.stringify(a)), undefined);
}

/* -------------------------------- core ---------------------------------- */

export function track(name: EventName, props: Props = {}) {
  const full = { ...props, path: location.pathname, lang: document.documentElement.lang || 'es' };
  if (DEBUG) console.debug('[track]', name, full);
  if (!KEY) return;
  if (ph) ph.capture(name, full);
  else queue.push([name, full]);
}

export function identify(email: string, props: Props = {}) {
  // Linking a person to their session only with explicit consent.
  if (!ph || getConsent() !== 'granted' || !email) return;
  ph.identify(email.toLowerCase(), props);
}

async function load() {
  if (!KEY || ph) return;
  const { default: posthog } = await import('posthog-js');
  const granted = getConsent() === 'granted';
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    persistence: granted ? 'localStorage+cookie' : 'memory',
    disable_session_recording: !granted,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { maskAllInputs: true, maskTextSelector: '[data-ph-mask]' },
    respect_dnt: true,
  });
  ph = posthog as unknown as PostHogLike;
  queue.splice(0).forEach(([n, p]) => ph!.capture(n, p));
}

export function setConsent(value: 'granted' | 'denied') {
  safe(() => localStorage.setItem(CONSENT_KEY, value), undefined);
  if (!ph) return;
  if (value === 'granted') {
    ph.set_config({ persistence: 'localStorage+cookie' });
    ph.startSessionRecording();
  } else {
    ph.stopSessionRecording();
    ph.set_config({ persistence: 'memory' });
    safe(() => {
      // Remove anything PostHog stored while consent was on.
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ph_'))
        .forEach((k) => localStorage.removeItem(k));
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim();
        if (name.startsWith('ph_')) document.cookie = `${name}=; Max-Age=0; path=/`;
      });
    }, undefined);
  }
}

/* ------------------------------ listeners ------------------------------- */

function wireClicks() {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('a, button, [data-service], [data-cal-link], [data-open-contact]') as HTMLElement | null;
      if (!el) return;
      const ev = classifyClick({
        href: el.getAttribute('href'),
        data: { ...el.dataset },
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        section: el.closest('section[id], header, footer, dialog')?.id || el.closest('header, footer, dialog')?.tagName.toLowerCase() || null,
        inNav: Boolean(el.closest('#site-header')),
        // Hero pills toggle on click; report the state they switch to.
        pressed: el.dataset.service !== undefined ? el.getAttribute('aria-pressed') !== 'true' : undefined,
      });
      if (ev) track(ev.name, ev.props);
    },
    { capture: true, passive: true },
  );
}

function wireForms() {
  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target as HTMLFormElement;
      if (form.id === 'contact-form') {
        const fd = new FormData(form);
        track('contact_submitted', { project: String(fd.get('proyecto') ?? '') });
        identify(String(fd.get('correo') ?? ''), { source: 'contact' });
      }
    },
    true,
  );
  // First interaction with the audit form = intent signal.
  const audit = document.getElementById('audit-form');
  audit?.addEventListener('focusin', () => track('audit_form_start'), { once: true });
}

function wireScroll() {
  const reported = new Set<number>();
  let ticking = false;
  const check = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.round((window.scrollY / max) * 100);
    for (const m of newScrollMilestones(pct, reported)) {
      reported.add(m);
      track('scroll_depth', { percent: m });
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    },
    { passive: true },
  );
}

function wireCal() {
  // Cal.com embed reports a confirmed booking (modal or inline).
  const w = window as unknown as { Cal?: (...args: unknown[]) => void };
  try {
    w.Cal?.('on', { action: 'bookingSuccessful', callback: () => track('booking_completed', { via: 'embed' }) });
  } catch {
    /* embed not on this page */
  }
}

function wireBus() {
  window.addEventListener('sx:track', (e) => {
    const d = (e as CustomEvent<{ name: EventName; props?: Props; identify?: string }>).detail;
    if (!d?.name) return;
    track(d.name, d.props ?? {});
    if (d.identify) identify(d.identify, { source: 'audit' });
  });
}

export function initAnalytics() {
  captureAttribution();
  wireBus();
  wireClicks();
  wireForms();
  wireScroll();
  wireCal();
  if (!KEY) return;
  // Respect a prior "reject" by staying cookieless; we still count visits
  // anonymously. Load after the page is idle so it never competes with LCP.
  const start = () => void load();
  if ('requestIdleCallback' in window) (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(start);
  else setTimeout(start, 1500);
}

export const analyticsEnabled = Boolean(KEY);
