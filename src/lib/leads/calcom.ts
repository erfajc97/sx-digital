/* Cal.com webhook: signature check (HMAC-SHA256 of the raw body, hex, in the
   `x-cal-signature-256` header) and BOOKING_CREATED → LeadInput mapping. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { LeadInput } from './types';

export function signCalPayload(rawBody: string, secret: string) {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function verifyCalSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signCalPayload(rawBody, secret), 'hex');
  const given = Buffer.from(signature.trim().replace(/^sha256=/, ''), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

interface CalAttendee {
  name?: string;
  email?: string;
  timeZone?: string;
  language?: { locale?: string };
}

export function bookingToLead(body: unknown): LeadInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as { triggerEvent?: string; payload?: Record<string, unknown> };
  if (b.triggerEvent !== 'BOOKING_CREATED' || !b.payload) return null;
  const p = b.payload;
  const attendee = (Array.isArray(p.attendees) ? (p.attendees[0] as CalAttendee) : undefined) ?? {};
  const responses = (p.responses ?? {}) as Record<string, { value?: unknown } | undefined>;
  const email = String(attendee.email ?? responses.email?.value ?? '').trim();
  if (!email) return null;
  const notes = responses.notes?.value ?? p.additionalNotes ?? p.description;
  return {
    source: 'calcom',
    email,
    name: String(attendee.name ?? responses.name?.value ?? '') || null,
    message: notes ? String(notes).slice(0, 2000) : null,
    locale: attendee.language?.locale?.startsWith('en') ? 'en' : 'es',
    consent: true, // booking implies accepting Cal.com's processing for the meeting
    meta: {
      uid: p.uid ?? null,
      title: p.title ?? null,
      startTime: p.startTime ?? null,
      endTime: p.endTime ?? null,
      timeZone: attendee.timeZone ?? null,
      eventType: (p.type as string) ?? null,
    },
  };
}
