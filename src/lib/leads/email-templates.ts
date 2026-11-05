/* HTML emails with SolvyX branding (inline styles only — email clients). */
import type { AuditReport } from './report-schema';
import type { Locale } from './types';

export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SERVICE_LABEL: Record<Locale, Record<string, string>> = {
  es: {
    automatizacion_ia: 'Automatización con IA',
    marketing_ads: 'Marketing y Ads con IA',
    web_app: 'Web / App a medida',
    fintech: 'Fintech y pagos',
    multimedia_ia: 'Contenido multimedia con IA',
  },
  en: {
    automatizacion_ia: 'AI automation',
    marketing_ads: 'AI marketing & ads',
    web_app: 'Custom web / app',
    fintech: 'Fintech & payments',
    multimedia_ia: 'AI multimedia content',
  },
};

export function serviceLabel(key: string, locale: Locale) {
  return SERVICE_LABEL[locale][key] ?? key;
}

export function bookingLink(base: string, email: string, name?: string | null) {
  const u = new URL(base);
  u.searchParams.set('email', email);
  if (name) u.searchParams.set('name', name);
  return u.toString();
}

const SITE = 'https://solvyxdigital.com';
const BRAND = '#639dfe';
const NIGHT = '#0d1426';
const CARD = '#151e36';
const INK = '#eef2fb';
const MUTED = '#a8b3cc';

function shell(inner: string, preheader: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:${NIGHT};">
<span style="display:none!important;opacity:0;color:transparent;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NIGHT};padding:32px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:0 4px 24px;"><a href="${SITE}" style="text-decoration:none"><img src="${SITE}/logo-3d.png" alt="SolvyX" width="120" style="display:block;height:auto;border:0"></a></td></tr>
${inner}
<tr><td style="padding:28px 4px 0;font-size:12px;line-height:1.6;color:${MUTED};">SolvyX · Automatización con IA y software a medida · <a href="${SITE}" style="color:${MUTED}">solvyxdigital.com</a><br>contact@solvyxdigital.com</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:linear-gradient(135deg,${BRAND},#7b6cff);color:#0b1020;font-weight:700;font-size:15px;text-decoration:none;padding:14px 26px;border-radius:999px">${esc(label)}</a>`;

export function auditReportEmail(args: {
  report: AuditReport;
  url: string;
  name?: string | null;
  email: string;
  locale: Locale;
  bookingUrl: string;
}) {
  const { report, url, name, email, locale } = args;
  const en = locale === 'en';
  const t = (es: string, eng: string) => (en ? eng : es);
  const cta = bookingLink(args.bookingUrl, email, name);

  const findings = report.hallazgos
    .map(
      (h, i) => `<tr><td style="padding:0 0 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid #26324f;border-radius:16px;">
<tr><td style="padding:18px 20px;">
<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${BRAND};font-weight:700">${i + 1} · ${esc(serviceLabel(h.servicio_solvyx, locale))}</div>
<div style="font-size:18px;font-weight:700;margin:6px 0 10px;color:${INK}">${esc(h.titulo)}</div>
<div style="font-size:14px;line-height:1.6;color:${MUTED}"><b style="color:${INK}">${t('Problema', 'Problem')}:</b> ${esc(h.problema)}</div>
<div style="font-size:14px;line-height:1.6;color:${MUTED};margin-top:6px"><b style="color:${INK}">${t('Impacto', 'Impact')}:</b> ${esc(h.impacto)}</div>
<div style="font-size:14px;line-height:1.6;color:${MUTED};margin-top:6px"><b style="color:${INK}">${t('Solución', 'Fix')}:</b> ${esc(h.solucion)}</div>
</td></tr></table></td></tr>`,
    )
    .join('');

  const wins = report.quick_wins.map((w) => `<li style="margin:0 0 8px">${esc(w)}</li>`).join('');

  const inner = `
<tr><td style="padding:0 4px 8px;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:${BRAND};font-weight:700">${t('Auditoría IA Gratis', 'Free AI Audit')}</td></tr>
<tr><td style="padding:0 4px 8px;font-size:26px;line-height:1.2;font-weight:700;color:${INK}">${t('Tu informe para', 'Your report for')} ${esc(report.negocio_detectado)}</td></tr>
<tr><td style="padding:0 4px 22px;font-size:15px;line-height:1.6;color:${MUTED}">${name ? `${t('Hola', 'Hi')} ${esc(name)}, ` : ''}${t('hemos analizado', 'we analyzed')} <a href="${esc(url)}" style="color:${BRAND}">${esc(url)}</a>. ${t('Esto es lo que más está frenando tu captación de clientes:', 'Here is what is holding back your lead generation the most:')}</td></tr>
<tr><td style="padding:0 0 22px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid #26324f;border-radius:16px;width:100%"><tr>
<td style="padding:18px 20px;font-size:14px;color:${MUTED}">${t('Puntuación de tu web', 'Your website score')}</td>
<td align="right" style="padding:18px 20px;font-size:32px;font-weight:800;color:${INK}">${report.puntuacion_web}<span style="font-size:15px;color:${MUTED}">/100</span></td>
</tr></table></td></tr>
${findings}
<tr><td style="padding:10px 4px 6px;font-size:18px;font-weight:700;color:${INK}">${t('3 mejoras rápidas para esta semana', '3 quick wins for this week')}</td></tr>
<tr><td style="padding:0 4px 18px;font-size:14px;line-height:1.6;color:${MUTED}"><ol style="padding-left:20px;margin:8px 0 0">${wins}</ol></td></tr>
<tr><td style="padding:8px 4px 6px;font-size:15px;line-height:1.6;color:${MUTED}">${t('¿Lo vemos juntos? En 30 minutos te enseñamos cómo resolver los puntos clave, sin compromiso.', 'Want to go through it together? In 30 minutes we will show you how to fix the key points — no strings attached.')}</td></tr>
<tr><td style="padding:12px 4px 0">${button(cta, t('Reservar llamada de 30 min', 'Book a 30-min call'))}</td></tr>`;

  const text = [
    `${t('Tu informe para', 'Your report for')} ${report.negocio_detectado} (${url})`,
    `${t('Puntuación', 'Score')}: ${report.puntuacion_web}/100`,
    '',
    ...report.hallazgos.map(
      (h, i) => `${i + 1}. ${h.titulo}\n   ${t('Problema', 'Problem')}: ${h.problema}\n   ${t('Impacto', 'Impact')}: ${h.impacto}\n   ${t('Solución', 'Fix')}: ${h.solucion}`,
    ),
    '',
    t('Mejoras rápidas:', 'Quick wins:'),
    ...report.quick_wins.map((w) => `- ${w}`),
    '',
    `${t('Reserva tu llamada', 'Book your call')}: ${cta}`,
  ].join('\n');

  return {
    subject: t(`Tu auditoría IA: ${report.puntuacion_web}/100 — ${report.negocio_detectado}`, `Your AI audit: ${report.puntuacion_web}/100 — ${report.negocio_detectado}`),
    html: shell(inner, t('Tu informe completo y 3 mejoras rápidas', 'Your full report and 3 quick wins')),
    text,
  };
}

/** Plain internal email (sales inbox / contact form notification). */
export function internalEmail(title: string, lines: string[], link?: string) {
  const body = lines.map((l) => `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${INK}">${esc(l).replace(/\n/g, '<br>')}</p>`).join('');
  const inner = `<tr><td style="padding:0 4px 14px;font-size:22px;font-weight:700;color:${INK}">${esc(title)}</td></tr>
<tr><td style="padding:0 4px">${body}</td></tr>
${link ? `<tr><td style="padding:16px 4px 0">${button(link, 'Abrir')}</td></tr>` : ''}`;
  return {
    html: shell(inner, title),
    text: [title, '', ...lines, link ? `\n${link}` : ''].join('\n'),
  };
}
