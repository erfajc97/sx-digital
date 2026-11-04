/* Cal.com webhook → leads table (source=calcom).
   Cal.com → Settings → Developer → Webhooks: URL https://solvyxdigital.com/api/webhooks/cal,
   trigger BOOKING_CREATED, secret = CALCOM_WEBHOOK_SECRET. */
import type { APIRoute } from 'astro';
import { bookingToLead, verifyCalSignature } from '@/lib/leads/calcom';
import { env } from '@/lib/leads/env';
import { json } from '@/lib/leads/http';
import { getServices } from '@/lib/leads/services';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secret = env('CALCOM_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'webhook not configured' }, 503);

  const raw = await request.text();
  if (raw.length > 256_000) return json({ error: 'payload too large' }, 413);
  if (!verifyCalSignature(raw, request.headers.get('x-cal-signature-256'), secret)) {
    return json({ error: 'invalid signature' }, 401);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const lead = bookingToLead(body);
  if (!lead) return json({ ok: true, ignored: true }); // other triggers / pings

  const services = getServices();
  try {
    const id = await services.store.saveLead(lead);
    await Promise.allSettled(
      services.notifiers.map((n) =>
        n.notify({
          title: `📅 Nueva reserva — ${lead.name ?? lead.email}`,
          lines: [`${lead.name ?? ''} <${lead.email}>`, `Inicio: ${String(lead.meta?.startTime ?? '—')}`, lead.message ?? ''].filter(Boolean),
        }),
      ),
    );
    return json({ ok: true, id });
  } catch (e) {
    console.error('[webhooks/cal] saveLead failed', e);
    return json({ error: 'store failed' }, 500); // Cal.com retries on non-2xx
  }
};
