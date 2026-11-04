import { describe, expect, it } from 'vitest';
import { bookingToLead, signCalPayload, verifyCalSignature } from '@/lib/leads/calcom';

const body = JSON.stringify({
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid: 'abc123',
    title: 'Llamada 30 min',
    startTime: '2026-11-10T10:00:00Z',
    attendees: [{ name: 'Laura', email: 'laura@example.com', timeZone: 'Europe/Madrid', language: { locale: 'es' } }],
    responses: { notes: { value: 'Quiero automatizar reservas' } },
  },
});

describe('Cal.com webhook', () => {
  it('verifies a valid HMAC-SHA256 signature and rejects tampering', () => {
    const sig = signCalPayload(body, 's3cret');
    expect(verifyCalSignature(body, sig, 's3cret')).toBe(true);
    expect(verifyCalSignature(body, sig, 'other')).toBe(false);
    expect(verifyCalSignature(body + ' ', sig, 's3cret')).toBe(false);
    expect(verifyCalSignature(body, null, 's3cret')).toBe(false);
    expect(verifyCalSignature(body, 'zz', 's3cret')).toBe(false);
  });

  it('maps BOOKING_CREATED to a calcom lead and ignores other triggers', () => {
    expect(bookingToLead(JSON.parse(body))).toMatchObject({
      source: 'calcom',
      email: 'laura@example.com',
      name: 'Laura',
      message: 'Quiero automatizar reservas',
      meta: { uid: 'abc123' },
    });
    expect(bookingToLead({ triggerEvent: 'BOOKING_CANCELLED', payload: {} })).toBeNull();
    expect(bookingToLead({ triggerEvent: 'PING' })).toBeNull();
  });
});
