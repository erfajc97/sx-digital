/* Copy for the free AI audit (form, results, home CTA) per locale. */
import type { Locale } from '@/i18n';

const es = {
  meta: {
    title: 'Auditoría IA Gratis de tu web | SolvyX',
    description:
      'Analizamos tu web con IA en segundos: contacto, reservas y pagos, SEO, contenido y automatización. Recibe los 3 problemas que más te están costando clientes y un informe completo por email.',
    resultTitle: 'Resultado de tu auditoría IA | SolvyX',
    resultDescription: 'Los 3 puntos que más clientes le están costando a tu web, tu puntuación y cómo resolverlos. Informe completo en tu email.',
  },
  hero: {
    eyebrow: 'Auditoría IA Gratis',
    title: '¿Cuántos clientes se te escapan por tu web?',
    lead: 'Pega tu URL y en menos de 30 segundos te decimos qué está frenando tu captación — contacto, reservas, SEO y automatización — con soluciones concretas.',
    bullets: ['3 hallazgos clave al instante', 'Informe completo en tu email', 'Sin compromiso · 100 % gratis'],
  },
  form: {
    url: 'URL de tu negocio',
    urlPh: 'tunegocio.com',
    name: 'Nombre',
    namePh: 'Tu nombre',
    email: 'Email',
    emailPh: 'tucorreo@empresa.com',
    sector: 'Sector',
    sectorPh: 'Elige tu sector…',
    consentPre: 'Acepto que SolvyX trate mis datos para enviarme la auditoría y contactarme sobre ella, según la',
    consentLink: 'política de privacidad',
    submit: 'Auditar mi web gratis',
    loading: 'Analizando tu web…',
    steps: ['Cargando tu web', 'Extrayendo señales', 'Analizando con IA', 'Preparando tu informe'],
    error: 'No hemos podido enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.',
    honeypot: 'No rellenes este campo',
  },
  sectors: {
    restauracion: 'Restauración',
    salud_bienestar: 'Salud y bienestar',
    belleza_estetica: 'Belleza y estética',
    retail_ecommerce: 'Tienda / e-commerce',
    inmobiliaria: 'Inmobiliaria',
    servicios_profesionales: 'Servicios profesionales',
    educacion: 'Educación y formación',
    turismo_hosteleria: 'Turismo y hostelería',
    construccion_reformas: 'Construcción y reformas',
    tecnologia_saas: 'Tecnología / SaaS',
    finanzas_seguros: 'Finanzas y seguros',
    otro: 'Otro',
  } as Record<string, string>,
  result: {
    eyebrow: 'Tu auditoría IA',
    score: 'Puntuación de tu web',
    top: 'Los 3 puntos que más te están costando clientes',
    problem: 'Problema',
    impact: 'Impacto',
    solution: 'Solución',
    emailNote: 'Te hemos enviado el informe completo (hasta 6 hallazgos y 3 mejoras rápidas) a',
    ctaTitle: '¿Lo resolvemos juntos?',
    ctaText: 'En 30 minutos te enseñamos cómo arreglar estos puntos y qué automatizar primero. Sin compromiso.',
    cta: 'Reservar llamada de 30 min',
    again: 'Auditar otra web',
    empty: 'No encontramos ningún resultado reciente en este navegador.',
    emptyCta: 'Hacer una auditoría',
    partialTitle: 'Hemos recibido tu solicitud',
  },
  services: {
    automatizacion_ia: 'Automatización con IA',
    marketing_ads: 'Marketing y Ads con IA',
    web_app: 'Web / App a medida',
    fintech: 'Fintech y pagos',
    multimedia_ia: 'Contenido multimedia con IA',
  } as Record<string, string>,
  homeCta: {
    eyebrow: 'Nuevo · Auditoría IA Gratis',
    title: 'Descubre en 30 segundos qué le falta a tu web para vender más',
    text: 'Nuestra IA revisa tu contacto, reservas y pagos, SEO y contenido, y te da 3 mejoras concretas. Gratis.',
    cta: 'Auditar mi web',
  },
};

type AuditCopy = typeof es;

const en: AuditCopy = {
  meta: {
    title: 'Free AI website audit | SolvyX',
    description:
      'We analyse your website with AI in seconds: contact, booking & payments, SEO, content and automation. Get the 3 issues costing you the most customers plus a full report by email.',
    resultTitle: 'Your AI audit result | SolvyX',
    resultDescription: 'The 3 issues costing your website the most customers, your score and how to fix them. Full report in your inbox.',
  },
  hero: {
    eyebrow: 'Free AI Audit',
    title: 'How many customers is your website losing?',
    lead: "Paste your URL and in under 30 seconds we'll show you what's holding back your lead generation — contact, booking, SEO and automation — with concrete fixes.",
    bullets: ['3 key findings instantly', 'Full report in your inbox', 'No strings attached · 100% free'],
  },
  form: {
    url: 'Your business URL',
    urlPh: 'yourbusiness.com',
    name: 'Name',
    namePh: 'Your name',
    email: 'Email',
    emailPh: 'you@company.com',
    sector: 'Industry',
    sectorPh: 'Choose your industry…',
    consentPre: 'I agree that SolvyX may process my data to send me the audit and contact me about it, as described in the',
    consentLink: 'privacy policy',
    submit: 'Audit my website for free',
    loading: 'Analysing your website…',
    steps: ['Loading your website', 'Extracting signals', 'Analysing with AI', 'Preparing your report'],
    error: "We couldn't send your request. Check your connection and try again.",
    honeypot: 'Leave this field empty',
  },
  sectors: {
    restauracion: 'Restaurants & food',
    salud_bienestar: 'Health & wellness',
    belleza_estetica: 'Beauty & aesthetics',
    retail_ecommerce: 'Retail / e-commerce',
    inmobiliaria: 'Real estate',
    servicios_profesionales: 'Professional services',
    educacion: 'Education & training',
    turismo_hosteleria: 'Tourism & hospitality',
    construccion_reformas: 'Construction & renovation',
    tecnologia_saas: 'Technology / SaaS',
    finanzas_seguros: 'Finance & insurance',
    otro: 'Other',
  },
  result: {
    eyebrow: 'Your AI audit',
    score: 'Your website score',
    top: 'The 3 issues costing you the most customers',
    problem: 'Problem',
    impact: 'Impact',
    solution: 'Fix',
    emailNote: "We've emailed the full report (up to 6 findings and 3 quick wins) to",
    ctaTitle: 'Shall we fix it together?',
    ctaText: "In 30 minutes we'll show you how to fix these points and what to automate first. No strings attached.",
    cta: 'Book a 30-min call',
    again: 'Audit another website',
    empty: "We couldn't find a recent result in this browser.",
    emptyCta: 'Run an audit',
    partialTitle: "We've received your request",
  },
  services: {
    automatizacion_ia: 'AI automation',
    marketing_ads: 'AI marketing & ads',
    web_app: 'Custom web / app',
    fintech: 'Fintech & payments',
    multimedia_ia: 'AI multimedia content',
  },
  homeCta: {
    eyebrow: 'New · Free AI Audit',
    title: 'Find out in 30 seconds what your website needs to sell more',
    text: 'Our AI reviews your contact options, booking & payments, SEO and content, and gives you 3 concrete fixes. Free.',
    cta: 'Audit my website',
  },
};

export function getAuditCopy(locale: Locale | string | undefined): AuditCopy {
  return locale === 'en' ? en : es;
}

export const auditPaths = {
  es: { form: '/auditoria/', result: '/auditoria/resultado/', privacy: '/privacidad/' },
  en: { form: '/en/audit/', result: '/en/audit/result/', privacy: '/en/privacy/' },
} as const;
