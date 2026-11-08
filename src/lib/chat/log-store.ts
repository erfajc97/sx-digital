/* Anonymous chat transcripts (to improve Solvy). Stored WITHOUT personal
   data — emails and phone numbers are redacted before saving — and deleted
   after 30 days (Supabase: expires_at + daily purge; see migration). */
import type { SupabaseClient } from '@supabase/supabase-js';
import { redactPII } from './guard';

export interface ChatLogRecord {
  sessionId: string;
  locale: 'es' | 'en';
  messages: { role: 'user' | 'assistant'; content: string }[];
  meta: Record<string, unknown>;
}

export interface IChatLog {
  readonly name: string;
  save(rec: ChatLogRecord): Promise<void>;
}

export const CHAT_RETENTION_DAYS = 30;

export function anonymize(rec: ChatLogRecord): ChatLogRecord {
  return { ...rec, messages: rec.messages.map((m) => ({ role: m.role, content: redactPII(m.content).slice(0, 4000) })) };
}

export class SupabaseChatLog implements IChatLog {
  readonly name = 'supabase';
  constructor(private readonly db: SupabaseClient) {}

  async save(rec: ChatLogRecord): Promise<void> {
    const clean = anonymize(rec);
    const { error } = await this.db.from('chat_sessions').upsert(
      {
        id: clean.sessionId,
        updated_at: new Date().toISOString(),
        locale: clean.locale,
        messages: clean.messages,
        meta: clean.meta,
        expires_at: new Date(Date.now() + CHAT_RETENTION_DAYS * 86_400_000).toISOString(),
      },
      { onConflict: 'id' },
    );
    if (error) throw new Error(`supabase_chat_log: ${error.message}`);
  }
}

export class MemoryChatLog implements IChatLog {
  readonly name = 'memory';
  readonly sessions = new Map<string, ChatLogRecord>();
  async save(rec: ChatLogRecord): Promise<void> {
    this.sessions.set(rec.sessionId, anonymize(rec));
  }
}
