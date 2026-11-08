/* Chat rate limits, on the same limiter as the audit (Supabase-backed in
   production, in-memory locally). Run audits inside the chat additionally
   count against the audit buckets (see tools.ts). */
import type { IRateLimiter } from '../leads/types';

const DAY = 24 * 60 * 60 * 1000;

export const CHAT_LIMITS = {
  perSession: { limit: 30, windowMs: DAY },
  perIp: { limit: 100, windowMs: DAY },
};

export async function checkChatLimits(
  limiter: IRateLimiter,
  ids: { sessionId: string; ipHash: string },
  limits = CHAT_LIMITS,
): Promise<{ ok: true } | { ok: false; scope: 'session' | 'ip'; retryAfterSec: number }> {
  // IP first: rotating the session id must not get around the daily cap.
  const ip = await limiter.hit(`chat:ip:${ids.ipHash}`, limits.perIp.limit, limits.perIp.windowMs);
  if (!ip.ok) return { ok: false, scope: 'ip', retryAfterSec: ip.retryAfterSec };
  const s = await limiter.hit(`chat:session:${ids.sessionId}`, limits.perSession.limit, limits.perSession.windowMs);
  if (!s.ok) return { ok: false, scope: 'session', retryAfterSec: s.retryAfterSec };
  return { ok: true };
}
