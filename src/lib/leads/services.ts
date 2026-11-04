/* Picks real or mock implementations from the environment. Missing keys →
   mocks, so `pnpm dev` works end-to-end with no accounts. */
import {
  ConsoleEmail,
  ConsoleNotifier,
  EmailNotifier,
  MemoryLeadStore,
  MemoryRateLimiter,
  ResendEmail,
  SlackNotifier,
  SupabaseLeadStore,
  SupabaseRateLimiter,
} from './adapters';
import { config, env } from './env';
import { AnthropicLLM, MockLLM } from './llm';
import type { INotifier, Services } from './types';

let cached: Services | null = null;

export function getServices(): Services {
  if (cached) return cached;

  const anthropicKey = env('ANTHROPIC_API_KEY');
  const llm = anthropicKey ? new AnthropicLLM(anthropicKey, config.anthropicModel, config.anthropicEffort) : new MockLLM();

  const resendKey = env('RESEND_API_KEY');
  const email = resendKey ? new ResendEmail(resendKey, config.emailFrom) : new ConsoleEmail();

  const supaUrl = env('SUPABASE_URL');
  const supaKey = env('SUPABASE_SERVICE_KEY');
  const supa = supaUrl && supaKey ? new SupabaseLeadStore(supaUrl, supaKey) : null;
  const store = supa ?? new MemoryLeadStore();
  const limiter = supa ? new SupabaseRateLimiter(supa) : new MemoryRateLimiter();

  const notifiers: INotifier[] = [];
  const slack = env('SLACK_WEBHOOK_URL');
  if (slack) notifiers.push(new SlackNotifier(slack));
  if (resendKey) notifiers.push(new EmailNotifier(email, config.salesEmail));
  if (notifiers.length === 0) notifiers.push(new ConsoleNotifier());

  cached = { llm, email, notifiers, store, limiter };
  console.info(
    `[leads] services: llm=${llm.name} email=${email.name} store=${store.name} limiter=${limiter.name} notify=${notifiers.map((n) => n.name).join('+')}`,
  );
  return cached;
}
