import type { APIRoute } from 'astro';
import { runAudit } from '@/lib/leads/audit-pipeline';
import { clientIp, json, readBody, sameOrigin } from '@/lib/leads/http';
import { getServices } from '@/lib/leads/services';

export const prerender = false;

const STATUS_CODE = { ok: 200, partial: 200, rate_limited: 429, invalid: 400 } as const;

export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  if (site && !sameOrigin(request, site)) return json({ status: 'invalid', message: 'forbidden' }, 403);

  const body = await readBody(request);
  if (!body) return json({ status: 'invalid', message: 'Invalid body' }, 400);

  let ip = 'unknown';
  try {
    ip = clientIp(request, clientAddress);
  } catch {
    ip = clientIp(request);
  }

  try {
    const res = await runAudit(body, { services: getServices(), ip });
    const headers: Record<string, string> = res.status === 'rate_limited' ? { 'Retry-After': String(res.retryAfterSec) } : {};
    return json(res, STATUS_CODE[res.status], headers);
  } catch (e) {
    console.error('[api/audit] unexpected', e);
    const en = body.locale === 'en';
    return json(
      {
        status: 'partial',
        message: en
          ? 'Something went wrong on our side. Book a 30-min call and we will review your site with you.'
          : 'Algo ha fallado de nuestro lado. Reserva una llamada de 30 min y revisamos tu web contigo.',
        bookingUrl: 'https://cal.com/solvyxdigital/30min',
      },
      200,
    );
  }
};

export const ALL: APIRoute = () => json({ error: 'Method Not Allowed' }, 405, { Allow: 'POST' });
