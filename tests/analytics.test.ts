import { describe, expect, it } from 'vitest';
import { attributionFromLanding, channelFor, sanitizeAttribution } from '@/lib/analytics/attribution';
import { classifyClick, newScrollMilestones } from '@/lib/analytics/events';
import { bookingToLead } from '@/lib/leads/calcom';

const NOW = '2026-11-05T10:00:00.000Z';

describe('attributionFromLanding', () => {
  it('reads UTM params, click ids and external referrer', () => {
    const a = attributionFromLanding(
      'https://solvyxdigital.com/auditoria?utm_source=meta&utm_medium=paid_social&utm_campaign=auditoria-nov&fbclid=abc',
      'https://l.instagram.com/some/path?x=1',
      NOW,
    );
    expect(a).toMatchObject({
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: 'auditoria-nov',
      fbclid: 'abc',
      referrer: 'https://l.instagram.com/some/path',
      landing: '/auditoria',
      channel: 'paid_social',
      first_seen: NOW,
    });
  });

  it('treats same-site referrers as direct and drops their URL', () => {
    const a = attributionFromLanding('https://solvyxdigital.com/precios', 'https://solvyxdigital.com/', NOW);
    expect(a?.referrer).toBeUndefined();
    expect(a?.channel).toBe('direct');
  });

  it('returns null for invalid URLs', () => {
    expect(attributionFromLanding('not a url', '', NOW)).toBeNull();
  });
});

describe('channelFor', () => {
  it.each([
    [{ gclid: 'x' }, 'paid_search'],
    [{ utm_medium: 'cpc', utm_source: 'google' }, 'paid_search'],
    [{ utm_medium: 'cpc', utm_source: 'facebook' }, 'paid_social'],
    [{ utm_medium: 'email' }, 'email'],
    [{ utm_source: 'partner' }, 'campaign'],
    [{ referrer: 'https://www.google.es/' }, 'organic_search'],
    [{ referrer: 'https://chatgpt.com/' }, 'ai_search'],
    [{ referrer: 'https://www.linkedin.com/feed/' }, 'social'],
    [{ referrer: 'https://blog.example.com/post' }, 'referral'],
    [{}, 'direct'],
  ])('%o → %s', (a, expected) => expect(channelFor(a)).toBe(expected));
});

describe('sanitizeAttribution', () => {
  it('accepts objects and JSON strings, dropping unknown keys and empty values', () => {
    expect(sanitizeAttribution({ utm_source: 'google', evil: '<script>', utm_term: '' })).toEqual({ utm_source: 'google' });
    expect(sanitizeAttribution('{"channel":"direct"}')).toEqual({ channel: 'direct' });
  });

  it('rejects junk', () => {
    expect(sanitizeAttribution('not json')).toBeUndefined();
    expect(sanitizeAttribution({ utm_source: 'x'.repeat(500) })).toBeUndefined();
    expect(sanitizeAttribution('x'.repeat(5000))).toBeUndefined();
    expect(sanitizeAttribution({})).toBeUndefined();
    expect(sanitizeAttribution(null)).toBeUndefined();
  });
});

describe('classifyClick', () => {
  const base = { data: {}, section: 'hero' };

  it.each([
    [{ href: 'https://wa.me/34600000000' }, 'whatsapp_click'],
    [{ href: 'tel:+34645425582' }, 'phone_click'],
    [{ href: 'mailto:contact@solvyxdigital.com' }, 'email_click'],
    [{ href: 'https://cal.com/solvyxdigital/30min' }, 'booking_click'],
    [{ href: '/agendar' }, 'booking_click'],
    [{ href: '/auditoria' }, 'audit_cta_click'],
    [{ href: '/en/audit/' }, 'audit_cta_click'],
    [{ href: 'https://www.linkedin.com/company/solvyx-digital/' }, 'social_click'],
  ])('%o → %s', (c, name) => expect(classifyClick({ ...base, ...c })?.name).toBe(name));

  it('uses data attributes (Cal buttons, contact modal, service pills, language)', () => {
    expect(classifyClick({ ...base, href: '#agenda', data: { calLink: 'solvyxdigital/30min' } })?.name).toBe('booking_click');
    expect(classifyClick({ ...base, data: { openContact: '', project: 'Fintech' } })).toEqual({
      name: 'contact_open',
      props: { section: 'hero', project: 'Fintech' },
    });
    expect(classifyClick({ ...base, data: { service: 'Fintech' }, pressed: true })).toEqual({
      name: 'service_selected',
      props: { section: 'hero', service: 'Fintech', selected: true },
    });
    expect(classifyClick({ ...base, href: '/en/', data: { langSwitch: 'en' } })?.name).toBe('lang_switch');
  });

  it('reports navbar links and ignores everything else', () => {
    expect(classifyClick({ ...base, href: '/nosotros', inNav: true })).toEqual({ name: 'nav_click', props: { target: '/nosotros' } });
    expect(classifyClick({ ...base, href: '/nosotros' })).toBeNull();
    expect(classifyClick({ ...base })).toBeNull();
  });
});

describe('newScrollMilestones', () => {
  it('reports each milestone once', () => {
    const seen = new Set<number>([25]);
    expect(newScrollMilestones(62, seen)).toEqual([50]);
    expect(newScrollMilestones(10, seen)).toEqual([]);
    expect(newScrollMilestones(100, new Set())).toEqual([25, 50, 75, 100]);
  });
});

describe('Cal.com booking attribution', () => {
  it('keeps utm params forwarded by Cal.com', () => {
    const lead = bookingToLead({
      triggerEvent: 'BOOKING_CREATED',
      payload: {
        attendees: [{ name: 'Laura', email: 'laura@example.com' }],
        metadata: { utm_source: 'solvyx_audit', utm_medium: 'audit_result', videoCallUrl: 'https://x' },
      },
    });
    expect(lead?.meta?.attribution).toEqual({ utm_source: 'solvyx_audit', utm_medium: 'audit_result', channel: 'audit_result' });
  });
});
