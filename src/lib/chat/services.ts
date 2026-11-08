/* Chat services + config from the environment. Missing ANTHROPIC_API_KEY →
   scripted mock model; missing Supabase → in-memory transcript log. */
import { brand } from '@/data/site';
import { SupabaseLeadStore } from '../leads/adapters';
import { config as leadsConfig, env, envInt } from '../leads/env';
import { getServices } from '../leads/services';
import { MemoryChatLog, SupabaseChatLog } from './log-store';
import { AnthropicChatModel, MockChatModel } from './model';
import type { ChatServices } from './tools';

let cached: ChatServices | null = null;

export function getChatServices(): ChatServices {
  if (cached) return cached;
  const base = getServices();
  const key = env('ANTHROPIC_API_KEY');
  const effort = env('CHAT_EFFORT');
  const chat = key
    ? new AnthropicChatModel(key, chatConfig().model, effort === 'medium' || effort === 'high' ? effort : 'low')
    : new MockChatModel();
  const chatLog = base.store instanceof SupabaseLeadStore ? new SupabaseChatLog(base.store.client) : new MemoryChatLog();
  cached = { ...base, chat, chatLog };
  console.info(`[chat] services: model=${chat.name} log=${chatLog.name}`);
  return cached;
}

export function chatConfig() {
  return {
    /** Fast model by default; override with CHAT_MODEL. */
    model: env('CHAT_MODEL') ?? 'claude-haiku-5-5',
    maxTokens: envInt('CHAT_MAX_TOKENS', 1024),
    budgetMs: envInt('CHAT_BUDGET_MS', 25_000),
    auditBudgetMs: envInt('CHAT_AUDIT_BUDGET_MS', 18_000),
    bookingUrl: leadsConfig.bookingUrl,
    whatsappNumber: env('SOLVY_WHATSAPP_NUMBER') ?? (brand.whatsapp ?? brand.phone),
    leadScoreThreshold: leadsConfig.leadScoreThreshold,
    salesEmail: leadsConfig.salesEmail,
    stateSecret: env('CHAT_STATE_SECRET') ?? leadsConfig.ipHashSalt,
    simulateFailure: env('CHAT_SIMULATE_FAILURE') === '1',
  };
}
