/* Solvy chat UI — loaded on demand by SolvyChat.astro. Renders the panel,
   streams /api/chat (NDJSON) and keeps the conversation in sessionStorage so
   it survives navigation between pages of the same visit. */
import css from './chat.css?inline';

type Trigger = 'manual' | 'proactive_pricing' | 'form_abandon' | 'ads';

export interface ChatCfg {
  locale: 'es' | 'en';
  privacy: string;
  audit: string;
  booking: string;
  calLink: string;
  whatsapp: string;
}

type AuditData = { url: string; puntuacion_web: number; hallazgos: { titulo: string; problema: string; solucion: string }[] };
type Item =
  | { k: 'bot'; text: string }
  | { k: 'user'; text: string }
  | { k: 'audit'; data: AuditData }
  | { k: 'consent' }
  | { k: 'booking'; url: string }
  | { k: 'whatsapp'; url: string }
  | { k: 'pill'; text: string }
  | { k: 'error'; text: string; whatsapp: string; booking: string };

interface Saved {
  sid: string;
  items: Item[];
  state?: string;
  consent: boolean;
  trigger: Trigger;
}

const STORE = 'solvy-conv';
const MAX_CHARS = 1000;
const MAX_HISTORY = 40;

const STRINGS = {
  es: {
    title: 'Solvy',
    sub: 'Asistente IA de SolvyX',
    close: 'Cerrar chat',
    log: 'Conversación con Solvy',
    input: 'Escribe tu mensaje',
    placeholder: 'Escribe aquí…',
    send: 'Enviar',
    typing: 'Solvy está escribiendo',
    fine: 'Solvy es una IA y puede equivocarse.',
    privacy: 'Privacidad',
    greet: {
      manual: '¡Hola! Soy Solvy 👋 un asistente de IA (no una persona) de SolvyX. Puedo auditar tu web en segundos, enseñarte cómo sería un bot para tu negocio o resolver tus dudas. ¿Por dónde empezamos?',
      proactive_pricing: '¡Hola! Soy Solvy, la IA de SolvyX 👋 ¿Dudas con los planes? Cuéntame qué necesitas y te digo cuál encaja (y qué pasos siguen).',
      form_abandon: '¡Hola! Soy Solvy, la IA de SolvyX 👋 ¿Te hago la auditoría aquí mismo? Solo pásame la dirección de tu web.',
      ads: '¡Hola! Soy Solvy, un asistente de IA de SolvyX 👋 ¿Te audito la web gratis o prefieres ver cómo sería un bot para tu negocio?',
    },
    quick: ['Audita mi web', 'Prueba tu propio bot', '¿Cuánto cuesta?'],
    consent: (href: string) => [`Acepto la `, ['política de privacidad', href], ' y que SolvyX me contacte sobre mi consulta.'] as const,
    consentOk: 'Gracias. Ya puedes escribir tu nombre y email.',
    book: 'Reservar llamada de 30 min',
    wa: 'Abrir WhatsApp',
    score: 'Puntuación de tu web',
    demo: (s: string) => `🎬 Demo: asistente de ${s} (negocio ficticio)`,
    demoEnd: '🎬 Fin de la demo',
    error: 'Ahora mismo no puedo responder. Escríbenos por WhatsApp o reserva una llamada y te atendemos hoy.',
    tooLong: `Máximo ${MAX_CHARS} caracteres por mensaje.`,
    newTab: '(se abre en una pestaña nueva)',
  },
  en: {
    title: 'Solvy',
    sub: 'SolvyX AI assistant',
    close: 'Close chat',
    log: 'Conversation with Solvy',
    input: 'Type your message',
    placeholder: 'Type here…',
    send: 'Send',
    typing: 'Solvy is typing',
    fine: 'Solvy is an AI and can make mistakes.',
    privacy: 'Privacy',
    greet: {
      manual: "Hi! I'm Solvy 👋 an AI assistant (not a person) from SolvyX. I can audit your website in seconds, show you what a bot for your business would look like, or answer your questions. Where shall we start?",
      proactive_pricing: "Hi! I'm Solvy, SolvyX's AI 👋 Not sure about the plans? Tell me what you need and I'll tell you which one fits (and what comes next).",
      form_abandon: "Hi! I'm Solvy, SolvyX's AI 👋 Want me to run the audit right here? Just send me your website address.",
      ads: "Hi! I'm Solvy, an AI assistant from SolvyX 👋 Shall I audit your website for free, or would you rather see a bot for your business?",
    },
    quick: ['Audit my website', 'Try your own bot', 'How much does it cost?'],
    consent: (href: string) => ['I accept the ', ['privacy policy', href], ' and that SolvyX may contact me about my enquiry.'] as const,
    consentOk: 'Thanks. You can now type your name and email.',
    book: 'Book a 30-min call',
    wa: 'Open WhatsApp',
    score: 'Your website score',
    demo: (s: string) => `🎬 Demo: ${s} assistant (made-up business)`,
    demoEnd: '🎬 End of demo',
    error: "I can't answer right now. Message us on WhatsApp or book a call and we'll get back to you today.",
    tooLong: `Up to ${MAX_CHARS} characters per message.`,
    newTab: '(opens in a new tab)',
  },
};
const QUICK_IDS = ['audit', 'demo', 'pricing'] as const;

const ICON = {
  close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  wa: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm5.86 15.7c-.32-.16-1.9-.94-2.2-1.05-.29-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.26-.19.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.65.15-.15.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.09 1.3 3.3.16.21 2.25 3.43 5.45 4.81.76.33 1.36.53 1.82.67.77.24 1.46.21 2.01.13.61-.09 1.9-.78 2.16-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z"/></svg>',
};

const SAFE_LINK_HOSTS = /(^|\.)(solvyxdigital\.com|cal\.com|wa\.me|escapadasmadrid\.com)$/i;

function track(name: string, props: Record<string, string | number | boolean> = {}) {
  window.dispatchEvent(new CustomEvent('sx:track', { detail: { name, props } }));
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string)[]) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v; // only used with the static ICON strings above
    else el.setAttribute(k, v);
  }
  el.append(...children);
  return el;
}

/** Plain text → nodes: safe links (allow-listed hosts or same-site paths)
    and **bold**; everything else stays text. No innerHTML. */
function richText(text: string): Node[] {
  const out: Node[] = [];
  const re = /(https?:\/\/[^\s)]+|\*\*[^*]+\*\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(document.createTextNode(text.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(h('strong', {}, tok.slice(2, -2)));
    else {
      let ok = false;
      try {
        ok = SAFE_LINK_HOSTS.test(new URL(tok).hostname);
      } catch {
        /* not a URL */
      }
      out.push(ok ? h('a', { href: tok, target: '_blank', rel: 'noopener noreferrer' }, tok) : document.createTextNode(tok));
    }
    last = m.index! + tok.length;
  }
  if (last < text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const x = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

function getAttribution(): unknown {
  try {
    return JSON.parse(sessionStorage.getItem('sx-attr') || 'null') ?? undefined;
  } catch {
    return undefined;
  }
}

export function mountChat(cfg: ChatCfg, hooks: { onClose: () => void }) {
  const s = STRINGS[cfg.locale];
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  let saved: Saved = (() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(STORE) || 'null') as Saved | null;
      if (v && Array.isArray(v.items) && v.sid) return v;
    } catch {
      /* ignore */
    }
    return { sid: uuid(), items: [], consent: false, trigger: 'manual' };
  })();
  const persist = () => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(saved));
    } catch {
      /* private mode: conversation lives only on this page */
    }
  };

  /* --------------------------------- DOM --------------------------------- */
  const isPhone = () => !window.matchMedia('(min-width: 768px)').matches;
  const log = h('div', { class: 'sx-chat__log', role: 'log', 'aria-live': 'polite', 'aria-label': s.log, tabindex: '0' });
  const quick = h('div', { class: 'sx-chat__quick', role: 'group', 'aria-label': cfg.locale === 'en' ? 'Suggestions' : 'Sugerencias' });
  s.quick.forEach((label, i) =>
    quick.append(
      Object.assign(h('button', { type: 'button' }, label), {
        onclick: () => {
          track('chat_quick_reply', { option: QUICK_IDS[i] });
          void send(label);
        },
      }),
    ),
  );
  const input = h('textarea', {
    class: 'sx-chat__input',
    id: 'solvy-input',
    rows: '1',
    maxlength: String(MAX_CHARS),
    placeholder: s.placeholder,
    'aria-describedby': 'solvy-count',
    autocomplete: 'off',
  }) as HTMLTextAreaElement;
  const count = h('span', { class: 'sx-chat__count', id: 'solvy-count', 'aria-live': 'polite' }, `0/${MAX_CHARS}`);
  const sendBtn = h('button', { type: 'submit', class: 'sx-chat__send', 'aria-label': s.send, html: ICON.send }) as HTMLButtonElement;
  const form = h(
    'form',
    { class: 'sx-chat__form' },
    h('div', { class: 'sx-chat__field' }, h('label', { for: 'solvy-input', class: 'sx-sr' }, s.input), input, count),
    sendBtn,
  );
  const closeBtn = h('button', { type: 'button', class: 'sx-chat__close', 'aria-label': s.close, html: ICON.close });
  const sheet = h(
    'section',
    { class: 'sx-chat__sheet' },
    h(
      'header',
      { class: 'sx-chat__head' },
      h('img', { class: 'sx-chat__avatar', src: '/solvy/solvy-128.webp', alt: '', width: '40', height: '40' }),
      h('div', {}, h('h2', { class: 'sx-chat__title', id: 'solvy-title' }, s.title), h('p', { class: 'sx-chat__sub' }, s.sub)),
      closeBtn,
    ),
    log,
    quick,
    form,
    h('p', { class: 'sx-chat__fine' }, `${s.fine} `, h('a', { href: cfg.privacy }, s.privacy)),
  );
  const backdrop = h('div', { class: 'sx-chat__backdrop' });
  const root = h('div', { class: 'sx-chat', id: 'solvy-panel', role: 'dialog', 'aria-labelledby': 'solvy-title', hidden: '' }, backdrop, sheet);
  document.body.append(root);

  /* ------------------------------- render -------------------------------- */
  const scroll = () => (log.scrollTop = log.scrollHeight);

  function linkButton(kind: 'booking' | 'whatsapp', url: string) {
    const a = h('a', {
      class: `sx-btn ${kind === 'booking' ? 'sx-btn--primary' : 'sx-btn--wa'}`,
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer',
      html: kind === 'booking' ? ICON.cal : ICON.wa,
    });
    a.append(kind === 'booking' ? s.book : s.wa, h('span', { class: 'sx-sr' }, ` ${s.newTab}`));
    a.addEventListener('click', (e) => {
      track(kind === 'booking' ? 'chat_booking_click' : 'chat_whatsapp_handoff', {});
      // Desktop + Cal embed on the page → open the booking modal in place, prefilled.
      const Cal = (window as unknown as { Cal?: (...a: unknown[]) => void }).Cal;
      if (kind === 'booking' && Cal && !isPhone()) {
        e.preventDefault();
        const u = new URL(url);
        Cal('modal', {
          calLink: cfg.calLink,
          config: { layout: 'month_view', ...(u.searchParams.get('name') ? { name: u.searchParams.get('name') } : {}), ...(u.searchParams.get('email') ? { email: u.searchParams.get('email') } : {}) },
        });
      }
    });
    return a;
  }

  function renderItem(item: Item): HTMLElement {
    switch (item.k) {
      case 'user':
        return h('div', { class: 'sx-msg sx-msg--user' }, item.text);
      case 'bot':
        return h('div', { class: 'sx-msg sx-msg--bot' }, ...richText(item.text));
      case 'pill':
        return h('div', { class: 'sx-pill' }, item.text);
      case 'audit': {
        const d = item.data;
        const ol = h('ol', {});
        d.hallazgos.forEach((f) => ol.append(h('li', {}, h('strong', {}, f.titulo), h('span', {}, f.solucion))));
        const score = h('div', { class: 'sx-audit__score', style: `--p:${d.puntuacion_web}`, 'aria-label': `${s.score}: ${d.puntuacion_web}/100`, role: 'img' }, h('span', { 'aria-hidden': 'true' }, String(d.puntuacion_web)));
        return h(
          'div',
          { class: 'sx-card sx-audit' },
          h('div', { class: 'sx-audit__top' }, score, h('div', {}, h('strong', {}, s.score), h('div', { class: 'sx-audit__url' }, d.url))),
          ol,
        );
      }
      case 'consent': {
        const box = h('input', { type: 'checkbox', id: `solvy-consent-${Math.random().toString(36).slice(2, 8)}` }) as HTMLInputElement;
        box.checked = saved.consent;
        const parts = s.consent(cfg.privacy).map((p) => (typeof p === 'string' ? p : h('a', { href: p[1], target: '_blank', rel: 'noopener noreferrer' }, p[0])));
        const card = h('div', { class: `sx-card sx-consent${saved.consent ? ' is-checked' : ''}` }, h('label', { for: box.id }, box, h('span', {}, ...parts)));
        box.addEventListener('change', () => {
          saved.consent = box.checked;
          card.classList.toggle('is-checked', box.checked);
          persist();
          if (box.checked) {
            input.placeholder = cfg.locale === 'en' ? 'Your name and email' : 'Tu nombre y email';
            input.focus();
          }
        });
        return card;
      }
      case 'booking':
      case 'whatsapp':
        return h('div', { class: 'sx-actions' }, linkButton(item.k, item.url));
      case 'error':
        return h(
          'div',
          { class: 'sx-card', role: 'alert' },
          h('p', { style: 'margin:0 0 .65rem' }, item.text),
          h('div', { class: 'sx-actions' }, linkButton('whatsapp', item.whatsapp), linkButton('booking', item.booking)),
        );
    }
  }

  function add(item: Item, { save = true } = {}) {
    if (save) {
      saved.items.push(item);
      persist();
    }
    const el = renderItem(item);
    log.append(el);
    scroll();
    return el;
  }

  function renderAll() {
    log.replaceChildren();
    saved.items.forEach((i) => add(i, { save: false }));
    quick.hidden = saved.items.some((i) => i.k === 'user');
  }

  /* ------------------------------- network ------------------------------- */
  let busy = false;

  function history() {
    const msgs = saved.items
      .filter((i): i is Extract<Item, { k: 'bot' | 'user' }> => i.k === 'bot' || i.k === 'user')
      .map((i) => ({ role: i.k === 'user' ? ('user' as const) : ('assistant' as const), content: i.k === 'bot' ? i.text.slice(0, 4000) : i.text }));
    // Merge consecutive bot bubbles (tool cards split them) and keep the tail.
    const merged: typeof msgs = [];
    for (const m of msgs) {
      const prev = merged[merged.length - 1];
      if (prev && prev.role === m.role && m.role === 'assistant') prev.content = `${prev.content}\n\n${m.content}`.slice(0, 4000);
      else merged.push({ ...m });
    }
    const tail = merged.slice(-MAX_HISTORY);
    while (tail.length && tail[0].role !== 'user') tail.shift();
    return tail;
  }

  function fallback(text = s.error) {
    add({ k: 'error', text, whatsapp: cfg.whatsapp, booking: cfg.booking });
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    if (msg.length > MAX_CHARS) {
      count.textContent = s.tooLong;
      count.classList.add('is-over');
      return;
    }
    busy = true;
    sendBtn.disabled = true;
    quick.hidden = true;
    input.value = '';
    updateCount();
    add({ k: 'user', text: msg });

    const typing = h('div', { class: 'sx-typing', role: 'status', 'aria-label': s.typing }, h('span', {}), h('span', {}), h('span', {}));
    log.append(typing);
    scroll();

    // Hand-off buttons go after the reply that introduces them.
    const pendingActions: Item[] = [];
    let bubble: HTMLElement | null = null;
    let current: Extract<Item, { k: 'bot' }> | null = null;
    const appendText = (d: string) => {
      typing.remove();
      if (!current) {
        current = { k: 'bot', text: '' };
        saved.items.push(current);
        bubble = renderItem(current);
        bubble.setAttribute('aria-busy', 'true');
        log.append(bubble);
      }
      current.text += d;
      bubble!.replaceChildren(...richText(current.text));
      scroll();
    };
    const closeBubble = () => {
      bubble?.removeAttribute('aria-busy');
      bubble = null;
      current = null;
      persist();
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({
          sessionId: saved.sid,
          locale: cfg.locale,
          messages: history(),
          consent: saved.consent,
          state: saved.state,
          trigger: saved.trigger,
          page: location.pathname.slice(0, 200),
          attribution: getAttribution(),
        }),
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `http_${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let gotAnything = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as Record<string, any>;
          gotAnything = true;
          if (ev.t === 'text') appendText(ev.d);
          else if (ev.t === 'reset') {
            const cur = current as Extract<Item, { k: 'bot' }> | null;
            if (cur) cur.text = '';
            appendText(ev.text);
          } else if (ev.t === 'ui') {
            typing.remove();
            closeBubble();
            const ui = ev.ui;
            if (ui.kind === 'audit') {
              add({ k: 'audit', data: ui.data });
              track('chat_audit_run', { score: ui.data.puntuacion_web });
            } else if (ui.kind === 'consent') {
              if (!saved.consent) add({ k: 'consent' });
            } else if (ui.kind === 'booking' || ui.kind === 'whatsapp') pendingActions.push({ k: ui.kind, url: ui.url });
            else if (ui.kind === 'demo') {
              add({ k: 'pill', text: s.demo(String(ui.sector)) });
              track('chat_demo_started', { sector: String(ui.sector).slice(0, 40) });
            } else if (ui.kind === 'demo_end') add({ k: 'pill', text: s.demoEnd });
            else if (ui.kind === 'lead') track('chat_lead_captured', { puntuacion: Number(ui.puntuacion) });
          } else if (ev.t === 'state') {
            saved.state = ev.state;
          } else if (ev.t === 'error') {
            typing.remove();
            closeBubble();
            add({ k: 'error', text: ev.message, whatsapp: ev.whatsapp, booking: ev.booking });
          }
        }
      }
      if (!gotAnything) throw new Error('empty');
    } catch (e) {
      typing.remove();
      closeBubble();
      const msg = e instanceof Error && !/^(http_|empty|Failed|NetworkError|Load failed)/.test(e.message) ? e.message : undefined;
      fallback(msg);
    } finally {
      typing.remove();
      closeBubble();
      pendingActions.forEach((a) => add(a));
      persist();
      busy = false;
      sendBtn.disabled = false;
      if (!isPhone()) input.focus();
    }
  }

  /* ------------------------------- events -------------------------------- */
  function updateCount() {
    const n = input.value.length;
    count.textContent = `${n}/${MAX_CHARS}`;
    count.classList.toggle('is-over', n >= MAX_CHARS);
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    input.style.overflowY = input.scrollHeight > 120 ? 'auto' : 'hidden';
  }
  input.addEventListener('input', updateCount);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void send(input.value);
  });

  function close() {
    root.hidden = true;
    document.documentElement.classList.remove('solvy-open');
    document.documentElement.style.overflow = '';
    hooks.onClose();
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    // Phone sheet is modal: keep Tab inside it.
    if (e.key === 'Tab' && isPhone()) {
      const f = [...sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, [tabindex="0"]')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function open(trigger: Trigger) {
    if (!saved.items.length) {
      saved.trigger = trigger;
      saved.items.push({ k: 'bot', text: s.greet[trigger] });
      persist();
    }
    renderAll();
    root.hidden = false;
    root.setAttribute('aria-modal', String(isPhone()));
    document.documentElement.classList.add('solvy-open');
    if (isPhone()) document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      scroll();
      (isPhone() ? closeBtn : input).focus();
    });
  }

  return { open, close };
}
