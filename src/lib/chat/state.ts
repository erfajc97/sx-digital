/* Conversation state that must survive between requests (serverless: no
   memory) but must not be forgeable by the browser: demo turn counter, the
   audit run in this chat, whether a lead was saved. Signed with HMAC and
   round-tripped by the client as an opaque string. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const ChatStateSchema = z.object({
  v: z.literal(1),
  sid: z.string(),
  audit: z
    .object({ id: z.string().nullable(), url: z.string(), score: z.number() })
    .optional(),
  demo: z.object({ sector: z.string(), turns: z.number().int().min(0), done: z.boolean() }).optional(),
  lead: z.object({ id: z.string().nullable(), name: z.string(), email: z.string() }).optional(),
});
export type ChatState = z.infer<typeof ChatStateSchema>;

export const DEMO_MAX_TURNS = 5;

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function encodeState(state: ChatState, secret: string): string {
  const payload = b64(JSON.stringify(state));
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns a fresh state when the token is missing, tampered with or belongs
    to another session. */
export function decodeState(token: string | undefined, sid: string, secret: string): ChatState {
  const fresh: ChatState = { v: 1, sid };
  if (!token) return fresh;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return fresh;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return fresh;
  try {
    const parsed = ChatStateSchema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    return parsed.success && parsed.data.sid === sid ? parsed.data : fresh;
  } catch {
    return fresh;
  }
}
