import type { APIRoute } from 'astro';
import { fallbackLinks, runChatTurn } from '@/lib/chat/engine';
import { ChatRequestSchema, type ChatEvent } from '@/lib/chat/schemas';
import { chatConfig, getChatServices } from '@/lib/chat/services';
import { hashIp } from '@/lib/leads/audit-pipeline';
import { clientIp, json, sameOrigin } from '@/lib/leads/http';

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;

/** POST /api/chat → NDJSON stream of ChatEvent (one JSON object per line). */
export const POST: APIRoute = async ({ request, clientAddress, site }) => {
  if (site && !sameOrigin(request, site)) return json({ error: 'forbidden' }, 403);
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return json({ error: 'json_required' }, 415);

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_BYTES) return json({ error: 'invalid_body' }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const parsed = ChatRequestSchema.safeParse(body);
  const config = chatConfig();
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const locale = (body as { locale?: unknown })?.locale === 'en' ? 'en' : 'es';
    return json(
      {
        error: 'invalid',
        field: issue?.path.join('.') ?? '',
        message: locale === 'en' ? 'Messages can be up to 1,000 characters.' : 'Los mensajes pueden tener hasta 1.000 caracteres.',
        ...fallbackLinks(config, locale),
      },
      400,
    );
  }

  let ip = 'unknown';
  try {
    ip = clientIp(request, clientAddress);
  } catch {
    ip = clientIp(request);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: ChatEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
        } catch {
          /* client went away */
        }
      };
      try {
        await runChatTurn(parsed.data, { services: getChatServices(), config, ipHash: hashIp(ip), emit, signal: request.signal });
      } catch (e) {
        console.error('[api/chat] unexpected', e);
        const en = parsed.data.locale === 'en';
        emit({
          t: 'error',
          code: 'unavailable',
          message: en ? "I can't answer right now. Message us on WhatsApp or book a call." : 'Ahora mismo no puedo responder. Escríbenos por WhatsApp o reserva una llamada.',
          ...fallbackLinks(config, parsed.data.locale),
        });
        emit({ t: 'done' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
};

export const ALL: APIRoute = () => json({ error: 'Method Not Allowed' }, 405, { Allow: 'POST' });
