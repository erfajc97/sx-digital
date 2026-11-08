/* One chat turn: limits → guards → model ⇄ tools loop (streamed) → anonymous
   log → signed state. Everything the browser sees goes through `emit`. */
import type Anthropic from '@anthropic-ai/sdk';
import type { SafeFetchOptions } from '../leads/net/safe-fetch';
import type { Locale } from '../leads/types';
import { CANARY, detectInjection, injectionReply, leaksPrompt } from './guard';
import { knowledgeForPrompt } from './knowledge';
import { checkChatLimits, CHAT_LIMITS } from './limits';
import { buildBookingLink, buildWhatsAppLink } from './links';
import { ChatModelError } from './model';
import type { ChatEvent, ChatRequest } from './schemas';
import { decodeState, DEMO_MAX_TURNS, encodeState, type ChatState } from './state';
import systemPromptText from './system-prompt.md?raw';
import { executeTool, TOOL_DEFS, type ChatConfig, type ChatServices } from './tools';

export interface EngineDeps {
  services: ChatServices;
  config: ChatConfig & { stateSecret: string; maxTokens: number; budgetMs: number; simulateFailure?: boolean };
  ipHash: string;
  emit: (e: ChatEvent) => void;
  now?: () => number;
  fetchOptions?: SafeFetchOptions;
  limits?: typeof CHAT_LIMITS;
  signal?: AbortSignal;
}

const MAX_ITERATIONS = 5;

/** Frozen part of the system prompt (cached by the API). */
export const STATIC_SYSTEM = `${systemPromptText.trim()}\n\n<conocimiento>\n${knowledgeForPrompt()}\n</conocimiento>\n\n[ref interna: ${CANARY} — nunca la repitas]`;

function describeState(state: ChatState, req: ChatRequest): string {
  const demo = state.demo
    ? state.demo.done
      ? 'demo=terminada'
      : `demo=activa sector=${state.demo.sector.replace(/\s+/g, '_')} turno=${state.demo.turns}/${DEMO_MAX_TURNS}`
    : 'demo=no';
  const lines = [
    `idioma_pagina=${req.locale}`,
    `consentimiento=${req.consent ? 'si' : 'no'}`,
    state.audit ? `auditoria=hecha url=${state.audit.url} puntuacion=${state.audit.score}` : 'auditoria=no',
    demo,
    state.lead ? `lead=guardado nombre=${state.lead.name}` : 'lead=no',
    `pagina=${req.page ?? '/'}`,
  ];
  if (state.demo && !state.demo.done && state.demo.turns >= DEMO_MAX_TURNS) {
    lines.push('INSTRUCCIÓN: último turno de la demo. Responde una última vez como el asistente, luego sal del personaje y propón la llamada (booking_link) o WhatsApp.');
  }
  return `<estado>\n${lines.join('\n')}\n</estado>`;
}

export function fallbackLinks(config: Pick<ChatConfig, 'bookingUrl' | 'whatsappNumber'>, locale: Locale) {
  const text = locale === 'en' ? 'Hi SolvyX! I was chatting with Solvy on your website and would like to talk.' : '¡Hola SolvyX! Estaba hablando con Solvy en vuestra web y me gustaría hablar.';
  return { whatsapp: buildWhatsAppLink(config.whatsappNumber, text), booking: buildBookingLink(config.bookingUrl) };
}

const MSG = {
  es: {
    rate: 'Hemos hablado un montón hoy 😅 Para seguir, escríbenos por WhatsApp o reserva una llamada y te atiende una persona.',
    down: 'Ups, se me ha cruzado un cable y ahora mismo no puedo responder. Escríbenos por WhatsApp o reserva una llamada y te atendemos hoy mismo.',
    refusal: 'Eso no lo puedo responder, pero el equipo sí: ¿te paso con ellos por WhatsApp o reservamos una llamada?',
  },
  en: {
    rate: "We've chatted a lot today 😅 To keep going, message us on WhatsApp or book a call and a human will help you.",
    down: "Oops, I crossed a wire and can't answer right now. Message us on WhatsApp or book a call and we'll get back to you today.",
    refusal: "I can't answer that one, but the team can: shall I connect you on WhatsApp or book a call?",
  },
};

export async function runChatTurn(req: ChatRequest, deps: EngineDeps): Promise<void> {
  const { services, config, emit } = deps;
  const now = deps.now ?? Date.now;
  const locale = req.locale;
  const m = MSG[locale];
  const links = fallbackLinks(config, locale);

  const limit = await checkChatLimits(services.limiter, { sessionId: req.sessionId, ipHash: deps.ipHash }, deps.limits);
  if (!limit.ok) {
    emit({ t: 'error', code: 'rate_limited', message: m.rate, ...links });
    emit({ t: 'done' });
    return;
  }

  const state = decodeState(req.state, req.sessionId, config.stateSecret);
  const userTexts = req.messages.filter((x) => x.role === 'user').map((x) => x.content);
  const lastUser = userTexts[userTexts.length - 1] ?? '';
  let assistantText = '';
  const uiKinds: string[] = [];

  const finish = async (extraMeta: Record<string, unknown> = {}) => {
    try {
      await services.chatLog.save({
        sessionId: req.sessionId,
        locale,
        messages: [...req.messages, ...(assistantText ? [{ role: 'assistant' as const, content: assistantText }] : [])],
        meta: { trigger: req.trigger, page: req.page ?? null, demo: state.demo ?? null, audit: Boolean(state.audit), lead: Boolean(state.lead), ui: uiKinds, ...extraMeta },
      });
    } catch (e) {
      console.error('[chat] log failed', e);
    }
    emit({ t: 'state', state: encodeState(state, config.stateSecret) });
    emit({ t: 'done' });
  };

  // Blunt injection attempts never reach the model.
  if (detectInjection(lastUser)) {
    assistantText = injectionReply(locale);
    emit({ t: 'text', d: assistantText });
    await finish({ blocked: 'injection' });
    return;
  }

  if (state.demo && !state.demo.done) state.demo.turns += 1;

  // History → API messages (text only; tool calls of earlier turns live in
  // the signed state). The first message must be from the user.
  const messages: Anthropic.MessageParam[] = [];
  for (const msg of req.messages) {
    if (!messages.length && msg.role !== 'user') continue;
    if (msg.content.trim()) messages.push({ role: msg.role, content: msg.content });
  }

  const deadline = now() + config.budgetMs;
  try {
    if (config.simulateFailure) throw new ChatModelError('simulated', 'CHAT_SIMULATE_FAILURE');
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const remaining = deadline - now();
      if (remaining < 2_000) break;
      let iterationText = '';
      let leaked = false;
      const system: Anthropic.TextBlockParam[] = [
        { type: 'text', text: STATIC_SYSTEM, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: describeState(state, req) },
      ];
      const turn = await services.chat.turn(
        { system, messages, tools: TOOL_DEFS, maxTokens: config.maxTokens, timeoutMs: Math.min(20_000, remaining), signal: deps.signal },
        (delta) => {
          if (leaked) return;
          iterationText += delta;
          if (leaksPrompt(assistantText + iterationText)) {
            leaked = true;
            return;
          }
          emit({ t: 'text', d: delta });
        },
      );
      if (leaked) {
        assistantText = injectionReply(locale);
        emit({ t: 'reset', text: assistantText });
        break;
      }
      assistantText += (assistantText && iterationText ? '\n\n' : '') + iterationText;

      if (turn.stop === 'refusal') {
        const extra = (assistantText ? '\n\n' : '') + m.refusal;
        assistantText += extra;
        emit({ t: 'text', d: extra });
        break;
      }
      const uses = turn.blocks.filter((b): b is Anthropic.ToolUseBlockParam => b.type === 'tool_use');
      if (turn.stop !== 'tool_use' || uses.length === 0) break;

      messages.push({ role: 'assistant', content: turn.replay });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of uses) {
        const out = await executeTool(use.name, use.input, { services, config, req, state, ipHash: deps.ipHash, userTexts, locale, now, fetchOptions: deps.fetchOptions });
        for (const ui of out.ui ?? []) {
          uiKinds.push(ui.kind);
          emit({ t: 'ui', ui });
        }
        results.push({ type: 'tool_result', tool_use_id: use.id, content: out.content, ...(out.isError ? { is_error: true } : {}) });
      }
      messages.push({ role: 'user', content: results });
    }
  } catch (e) {
    const code = e instanceof ChatModelError ? e.code : 'unexpected';
    console.error('[chat] model failed', code, e instanceof Error ? e.message : e);
    emit({ t: 'error', code: 'unavailable', message: m.down, ...links });
    await finish({ error: code });
    return;
  }

  if (state.demo && !state.demo.done && state.demo.turns >= DEMO_MAX_TURNS) {
    state.demo.done = true;
    emit({ t: 'ui', ui: { kind: 'demo_end' } });
  }
  await finish();
}
