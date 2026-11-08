/* Hand-off links built by the server (never by the model). Pure. */
import { bookingLink } from '../leads/email-templates';

export const WHATSAPP_TEXT_MAX = 700;

/** https://wa.me/<digits>?text=<encoded>. Throws on a number that is not
    E.164-ish so a bad env var is caught instead of shipping a dead link. */
export function buildWhatsAppLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) throw new Error('invalid_whatsapp_number');
  const clean = text
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, WHATSAPP_TEXT_MAX);
  return `https://wa.me/${digits}${clean ? `?text=${encodeURIComponent(clean)}` : ''}`;
}

export function buildBookingLink(base: string, contact?: { name?: string | null; email?: string | null }): string {
  if (contact?.email) return bookingLink(base, contact.email, contact.name);
  const u = new URL(base);
  if (contact?.name) u.searchParams.set('name', contact.name);
  return u.toString();
}
