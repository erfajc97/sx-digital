/* Website contact form (ContactModal) → leads table (source=contact) + the
   same notification email the old Netlify Function sent. */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { hashIp } from '@/lib/leads/audit-pipeline';
import { internalEmail } from '@/lib/leads/email-templates';
import { config } from '@/lib/leads/env';
import { clientIp, json, readBody, sameOrigin } from '@/lib/leads/http';
import { getServices } from '@/lib/leads/services';

export const prerender = false;

const ContactSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  correo: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  empresa: z.string().trim().max(160).optional().default(''),
  proyecto: z.string().trim().max(120).optional().default(''),
  mensaje: z.string().trim().max(4000).optional().default(''),
  company_site: z.string().max(500).optional().default(''), // honeypot
});

export const POST: APIRoute = async ({ request, clientAddress, site, currentLocale }) => {
  if (site && !sameOrigin(request, site)) return json({ error: 'forbidden' }, 403);
  const body = await readBody(request);
  const parsed = ContactSchema.safeParse(body ?? {});
  if (!parsed.success) return json({ error: 'Faltan campos requeridos (nombre y correo).' }, 400);
  const d = parsed.data;
  if (d.company_site) return json({ ok: true });

  const services = getServices();
  let ip = 'unknown';
  try {
    ip = clientIp(request, clientAddress);
  } catch {
    ip = clientIp(request);
  }
  const rl = await services.limiter.hit(`contact:ip:${hashIp(ip)}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(rl.retryAfterSec) });

  let leadId: string | null = null;
  try {
    leadId = await services.store.saveLead({
      source: 'contact',
      email: d.correo,
      name: d.nombre,
      company: d.empresa || null,
      message: d.mensaje || null,
      locale: currentLocale === 'en' ? 'en' : 'es',
      meta: { proyecto: d.proyecto || null },
    });
  } catch (e) {
    console.error('[api/contact] saveLead failed', e);
  }

  const { html, text } = internalEmail('Nuevo lead desde solvyxdigital.com', [
    `Nombre: ${d.nombre}`,
    `Correo: ${d.correo}`,
    `Empresa: ${d.empresa || '—'}`,
    `Tipo de proyecto: ${d.proyecto || '—'}`,
    `Mensaje:\n${d.mensaje || '—'}`,
    leadId ? `Lead id: ${leadId}` : '',
  ].filter(Boolean));

  try {
    await services.email.send({
      to: [config.contactInbox],
      replyTo: d.correo,
      subject: `Nuevo proyecto: ${d.proyecto || 'Contacto'} — ${d.nombre}`,
      html,
      text,
    });
  } catch (e) {
    console.error('[api/contact] email failed', e);
    // Lead is stored; only fail the request if we also couldn't store it.
    if (!leadId) return json({ error: 'No se pudo enviar el mensaje.' }, 502);
  }
  return json({ ok: true });
};

export const ALL: APIRoute = () => json({ error: 'Method Not Allowed' }, 405, { Allow: 'POST' });
