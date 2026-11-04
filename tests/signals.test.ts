import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSignals, summarizeText } from '@/lib/leads/signals';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('extractSignals — weak site', () => {
  const { signals: s, text } = extractSignals(fixture('weak-site.html'), {
    url: 'http://pizzerialucca.example/',
    status: 200,
    responseMs: 420,
  });

  it('reads basic SEO signals', () => {
    expect(s.title).toBe('Pizzería Lucca');
    expect(s.metaDescription).toBeNull();
    expect(s.h1).toEqual([]);
    expect(s.lang).toBeNull();
    expect(s.viewport).toBe(false);
    expect(s.https).toBe(false);
    expect(s.responseMs).toBe(420);
    expect(s.generator).toMatch(/WordPress/);
  });

  it('counts images without alt (missing vs empty)', () => {
    expect(s.images).toEqual({ total: 3, missingAlt: 2, emptyAlt: 1 });
  });

  it('detects placeholder media and lorem ipsum', () => {
    const kinds = s.placeholders.map((p) => p.kind);
    expect(kinds).toEqual(expect.arrayContaining(['picsum', 'unsplash_source', 'gtv_videos_bucket', 'sample_video', 'lorem_ipsum']));
  });

  it('finds no contact methods (search form is not a contact form)', () => {
    expect(s.contact).toEqual({ whatsapp: 0, tel: 0, mailto: 0, forms: 1, contactForms: 0 });
  });

  it('finds no booking/payment, no schema, no OG, no social, no English', () => {
    expect(Object.values(s.commerce).every((v) => v === false)).toBe(true);
    expect(s.structuredData).toEqual({ jsonLdTypes: [], microdata: 0 });
    expect(s.openGraph).toEqual({ title: false, description: false, image: false });
    expect(s.social).toEqual([]);
    expect(s.englishVersion).toBe(false);
  });

  it('visible text excludes scripts', () => {
    expect(text).toContain('Las mejores pizzas del barrio');
    expect(text).not.toContain('console.log');
  });
});

describe('extractSignals — strong site', () => {
  const { signals: s } = extractSignals(fixture('strong-site.html'), {
    url: 'https://clinicasonrisa.example/',
    finalUrl: 'https://clinicasonrisa.example/',
    status: 200,
  });

  it('reads SEO + language', () => {
    expect(s.https).toBe(true);
    expect(s.lang).toBe('es');
    expect(s.h1).toEqual(['Tu dentista de confianza en Barcelona']);
    expect(s.metaDescriptionLength).toBeGreaterThan(50);
    expect(s.canonical).toBe('https://clinicasonrisa.example/');
  });

  it('detects every contact method', () => {
    expect(s.contact).toMatchObject({ whatsapp: 1, tel: 1, mailto: 1, contactForms: 1 });
  });

  it('detects booking and payment providers', () => {
    expect(s.commerce).toMatchObject({ stripe: true, calendly: true, bizum: true, bookingCta: true, calcom: false, cart: false });
  });

  it('reads schema.org types from @graph and type arrays', () => {
    expect(s.structuredData.jsonLdTypes).toEqual(expect.arrayContaining(['Dentist', 'WebSite', 'Thing']));
  });

  it('detects Open Graph, socials, English version and analytics', () => {
    expect(s.openGraph).toEqual({ title: true, description: true, image: true });
    expect(s.social).toEqual(expect.arrayContaining(['instagram', 'facebook']));
    expect(s.englishVersion).toBe(true);
    expect(s.analytics).toContain('google_analytics');
    expect(s.placeholders).toEqual([]);
    expect(s.images).toEqual({ total: 1, missingAlt: 0, emptyAlt: 0 });
  });
});

describe('summarizeText', () => {
  it('keeps short text and trims long text to the budget', () => {
    expect(summarizeText('hola')).toBe('hola');
    const out = summarizeText('a'.repeat(50_000), 1_000);
    expect(out.length).toBeLessThan(1_100);
    expect(out).toContain('recortado');
  });
});
