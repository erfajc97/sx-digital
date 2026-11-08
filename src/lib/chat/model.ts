/* IChatModel: one model turn (streamed text + tool calls). Real Claude via
   @anthropic-ai/sdk, or a scripted mock so the whole chat — tools included —
   runs locally without ANTHROPIC_API_KEY. */
import Anthropic from '@anthropic-ai/sdk';

export type ModelBlock = Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam;

export interface ModelTurnRequest {
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface ModelTurn {
  /** Text + tool_use blocks, for the engine's logic. */
  blocks: ModelBlock[];
  /** Exactly what to append as the assistant turn (keeps thinking blocks). */
  replay: Anthropic.ContentBlockParam[];
  stop: 'end_turn' | 'tool_use' | 'max_tokens' | 'refusal' | 'other';
}

export interface IChatModel {
  readonly name: string;
  turn(req: ModelTurnRequest, onText: (delta: string) => void): Promise<ModelTurn>;
}

export class ChatModelError extends Error {
  constructor(
    public readonly code: 'timeout' | 'api_error' | 'rate_limited' | 'simulated',
    message: string,
  ) {
    super(message);
    this.name = 'ChatModelError';
  }
}

/* -------------------------------------------------------------------------- */

export class AnthropicChatModel implements IChatModel {
  readonly name: string;
  private client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly effort: 'low' | 'medium' | 'high',
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 1 });
    this.name = `anthropic:${model}`;
  }

  async turn(req: ModelTurnRequest, onText: (delta: string) => void): Promise<ModelTurn> {
    let message: Anthropic.Message;
    try {
      const stream = this.client.messages.stream(
        {
          model: this.model,
          max_tokens: req.maxTokens,
          system: req.system,
          messages: req.messages,
          tools: req.tools,
          output_config: { effort: this.effort },
        },
        { timeout: req.timeoutMs, signal: req.signal },
      );
      stream.on('text', onText);
      message = await stream.finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionTimeoutError) throw new ChatModelError('timeout', 'chat_timeout');
      if (err instanceof Anthropic.RateLimitError) throw new ChatModelError('rate_limited', 'anthropic_429');
      if (err instanceof Anthropic.APIError) throw new ChatModelError('api_error', `anthropic_${err.status ?? 'error'}`);
      throw new ChatModelError('api_error', err instanceof Error ? err.message : 'chat_failed');
    }

    const blocks: ModelBlock[] = [];
    for (const b of message.content) {
      if (b.type === 'text') blocks.push({ type: 'text', text: b.text });
      else if (b.type === 'tool_use') blocks.push({ type: 'tool_use', id: b.id, name: b.name, input: b.input });
    }
    const s = message.stop_reason;
    const stop = s === 'end_turn' || s === 'tool_use' || s === 'max_tokens' || s === 'refusal' ? s : 'other';
    return { blocks, replay: message.content as Anthropic.ContentBlockParam[], stop };
  }
}

/* --------------------------------- mock ---------------------------------- */

const URL_RE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SECTORS = /(inmobiliaria|real estate|restaurante|restaurant|cl[ií]nica|clinic|dental|gimnasio|gym|peluquer[ií]a|salon|hotel|tienda|shop|abogad|law|academia|school|taller|agencia)/i;

let mockIds = 0;
const toolUse = (name: string, input: Record<string, unknown>): Anthropic.ToolUseBlockParam => ({
  type: 'tool_use',
  id: `toolu_mock_${++mockIds}`,
  name,
  input,
});

function textOf(m: Anthropic.MessageParam | undefined): string {
  if (!m) return '';
  if (typeof m.content === 'string') return m.content;
  return m.content.map((b) => (b.type === 'text' ? b.text : '')).join(' ');
}

/** Deterministic stand-in for Claude: follows the four product flows (audit
    → email → lead, own-bot demo, pricing, hand-offs) by keyword. */
export class MockChatModel implements IChatModel {
  readonly name = 'mock';

  async turn(req: ModelTurnRequest, onText: (delta: string) => void): Promise<ModelTurn> {
    const ctx = req.system.map((s) => s.text).join('\n');
    const en = /idioma_pagina=en/.test(ctx) && !/idioma_usuario=es/.test(ctx);
    const t = (es: string, eng: string) => (en ? eng : es);
    const consent = /consentimiento=si/.test(ctx);
    const demo = ctx.match(/demo=activa sector=([^\s]+) turno=(\d+)\/(\d+)/);
    const leadSaved = /lead=guardado/.test(ctx);

    const blocks: ModelBlock[] = [];
    const say = (s: string) => blocks.push({ type: 'text', text: s });
    const call = (name: string, input: Record<string, unknown> = {}) => blocks.push(toolUse(name, input));

    const last = req.messages[req.messages.length - 1];
    const blocksOf = (msg: Anthropic.MessageParam | undefined) => (msg && Array.isArray(msg.content) ? (msg.content as Anthropic.ContentBlockParam[]) : []);
    const results = blocksOf(last).filter((b) => b.type === 'tool_result') as Anthropic.ToolResultBlockParam[];

    if (results.length) {
      // Answer to the tool results of the previous assistant turn.
      const prev = req.messages[req.messages.length - 2];
      const uses = blocksOf(prev).filter((b) => b.type === 'tool_use') as Anthropic.ToolUseBlockParam[];
      for (const r of results) {
        const use = uses.find((u) => u.id === r.tool_use_id);
        const data = JSON.parse(typeof r.content === 'string' ? r.content : '{}') as Record<string, any>;
        switch (use?.name) {
          case 'run_audit':
            if (data.ok) {
              const titles = (data.hallazgos as { titulo: string }[]).map((h) => h.titulo.toLowerCase());
              say(t(`Tu web saca ${data.puntuacion_web}/100. Lo más urgente: ${titles.join(', ')}. ¿Te envío el informe completo por email?`, `Your site scores ${data.puntuacion_web}/100. Most urgent: ${titles.join(', ')}. Shall I email you the full report?`));
            } else say(`${data.mensaje} ${t('¿Lo vemos juntos en una llamada de 30 min?', 'Want to go through it on a 30-min call?')}`);
            break;
          case 'get_pricing_info': {
            const express = (data.planes as { nombre: string; precio: string }[])[0];
            say(t(`${express.nombre}: ${express.precio.toLowerCase()}. Crecimiento y Escala son a medida según alcance. ¿Reservamos esa llamada y te damos el número exacto?`, `${express.nombre}: fixed quote within 24 h after a 30-min call. Growth and Scale are tailored to scope. Shall we book that call and get you an exact figure?`));
            break;
          }
          case 'request_consent':
            say(t('Marca la casilla de privacidad y escríbeme tu nombre y email, y te lo mando.', 'Tick the privacy box and type your name and email, and I’ll send it over.'));
            break;
          case 'save_lead':
            if (data.ok) say(t('¡Hecho! Te llega el informe completo en unos minutos. ¿Reservamos ya la llamada de 30 min para revisarlo juntos?', 'Done! The full report will reach your inbox in a few minutes. Shall we book the 30-min call to go through it?'));
            else if (data.error === 'consent_required') say(t('Antes de guardar nada necesito que marques la casilla de privacidad 👆', 'Before I save anything, please tick the privacy box 👆'));
            else say(t('Escríbeme tu email y lo guardo.', 'Type your email and I’ll save it.'));
            break;
          case 'booking_link':
            say(t('Aquí tienes el enlace para elegir hueco 👇', 'Here’s the link to pick a slot 👇'));
            break;
          case 'whatsapp_handoff':
            say(t('Te dejo el WhatsApp con el resumen ya escrito, solo dale a enviar 👇', 'Here’s WhatsApp with the summary pre-written, just hit send 👇'));
            break;
          case 'start_demo':
            say(t(`¡Hola! Soy Luna, la asistente de "Casa Norte ${data.sector}" (negocio ficticio). ¿Buscas comprar, vender o alquilar?`, `Hi! I'm Luna, the assistant at "Casa Norte ${data.sector}" (a made-up business). Are you looking to buy, sell or rent?`));
            break;
          default:
            say(t('Listo.', 'Done.'));
        }
      }
      return this.emit(blocks, onText, 'end_turn');
    }

    const text = textOf(last);
    const lower = text.toLowerCase();
    const prevAssistant = textOf([...req.messages].reverse().find((m) => m.role === 'assistant')).toLowerCase();

    if (demo) {
      const turn = Number(demo[2]);
      const max = Number(demo[3]);
      if (turn >= max) {
        say(t('Fin de la demo 🎬 Así atendería tu asistente: responde al momento, cualifica y propone cita, 24/7. ¿Lo montamos para tu negocio? Hablémoslo en 30 min.', "End of demo 🎬 That's how your assistant would work: instant answers, qualifying and booking, 24/7. Shall we build it for your business? Let's talk for 30 min."));
        call('booking_link');
      } else {
        const lines = en
          ? ['Great! Which area are you interested in, and roughly what budget?', 'Perfect, I have 3 options that fit. Would you like to visit one this week?', 'Done ✅ Could you give me a name and phone so the agent can confirm?', 'Thanks! You’ll get a confirmation shortly. Anything else I can help with?']
          : ['¡Genial! ¿Qué zona te interesa y con qué presupuesto aproximado?', 'Perfecto, tengo 3 opciones que encajan. ¿Te gustaría visitar alguna esta semana?', 'Hecho ✅ ¿Me dejas un nombre y teléfono para que el agente te confirme?', '¡Gracias! Te llegará la confirmación en breve. ¿Algo más en lo que te ayude?'];
        say(lines[Math.min(turn - 1, lines.length - 1)] ?? lines[0]);
      }
      return this.emit(blocks, onText, blocks.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn');
    }

    const email = text.match(EMAIL_RE)?.[0];
    const url = !email ? text.match(URL_RE)?.[1] : undefined;

    if (email && !leadSaved) {
      if (!consent) call('request_consent');
      else {
        const nombre = text.match(/(?:me llamo|soy|my name is|i'm|i am)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i)?.[1] ?? email.split('@')[0];
        const audited = /auditoria=hecha/.test(ctx);
        call('save_lead', {
          nombre,
          email,
          resumen: audited ? 'Auditó su web en el chat y pidió el informe completo por email.' : 'Dejó su email en el chat de Solvy.',
          puntuacion: audited ? 75 : 50,
        });
      }
    } else if (url) {
      say(t('¡Vamos! Le echo un ojo a tu web, dame unos segundos… 🔍', 'On it! Taking a look at your site, give me a few seconds… 🔍'));
      call('run_audit', { url });
    } else if (/precio|cuesta|cu[aá]nto|tarifa|cost|price|pricing|how much/.test(lower)) {
      call('get_pricing_info');
    } else if (/propio bot|prueba tu|own bot|try your/.test(lower)) {
      say(t('¡Me encanta! ¿A qué se dedica tu negocio? Dime el sector y me convierto en su asistente.', "Love it! What does your business do? Tell me the sector and I'll become its assistant."));
    } else if (SECTORS.test(lower) && /sector|a qu[eé] se dedica|what does your business/.test(prevAssistant)) {
      call('start_demo', { sector: lower.match(SECTORS)![1] });
    } else if (/audit/.test(lower)) {
      say(t('¡Claro! Pásame la dirección de tu web (por ejemplo, tunegocio.com) y te digo qué le falta para vender más.', "Sure! Send me your website address (e.g. yourbusiness.com) and I'll tell you what's holding it back."));
    } else if (/whatsapp/.test(lower)) {
      call('whatsapp_handoff', { resumen: t('Hola SolvyX, vengo del chat de Solvy y me gustaría hablar sobre mi proyecto.', "Hi SolvyX, I'm coming from the Solvy chat and would like to talk about my project.") });
    } else if (/llamada|agendar|reservar|cita|call|book/.test(lower)) {
      call('booking_link');
    } else if (/^(s[ií]|vale|ok|claro|venga|yes|sure|please)(?![a-z])/.test(lower) && /email/.test(prevAssistant)) {
      call('request_consent');
    } else {
      say(t('Puedo auditar tu web en segundos, enseñarte un bot para tu negocio o contarte cómo trabajamos. ¿Por dónde empezamos?', 'I can audit your website in seconds, show you a bot for your business or tell you how we work. Where shall we start?'));
    }
    return this.emit(blocks, onText, blocks.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn');
  }

  private async emit(blocks: ModelBlock[], onText: (d: string) => void, stop: ModelTurn['stop']): Promise<ModelTurn> {
    for (const b of blocks) {
      if (b.type !== 'text') continue;
      for (const word of b.text.match(/\S+\s*/g) ?? []) {
        onText(word);
        await new Promise((r) => setTimeout(r, 12));
      }
    }
    return { blocks, replay: blocks, stop };
  }
}
