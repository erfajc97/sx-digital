import { describe, expect, it } from 'vitest';
import { ConsoleEmail, ConsoleNotifier, MemoryLeadStore, MemoryRateLimiter } from '@/lib/leads/adapters';
import { LIMITS, runAudit } from '@/lib/leads/audit-pipeline';
import { MockLLM } from '@/lib/leads/llm';
import type { Services } from '@/lib/leads/types';

describe('MemoryRateLimiter (sliding window)', () => {
  it('allows `limit` hits per window, then blocks with Retry-After', async () => {
    let now = 1_000_000;
    const rl = new MemoryRateLimiter(() => now);
    const hour = 60 * 60 * 1000;
    for (let i = 0; i < 3; i++) expect((await rl.hit('ip:a', 3, hour)).ok).toBe(true);
    const blocked = await rl.hit('ip:a', 3, hour);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(3600);

    now += 30 * 60 * 1000;
    expect((await rl.hit('ip:a', 3, hour)).retryAfterSec).toBe(1800);
  });

  it('keys are independent', async () => {
    const rl = new MemoryRateLimiter(() => 0);
    for (let i = 0; i < 3; i++) await rl.hit('ip:a', 3, 1000);
    expect((await rl.hit('ip:a', 3, 1000)).ok).toBe(false);
    expect((await rl.hit('ip:b', 3, 1000)).ok).toBe(true);
  });

  it('frees slots as old hits leave the window', async () => {
    let now = 0;
    const rl = new MemoryRateLimiter(() => now);
    await rl.hit('k', 2, 1000);
    now = 500;
    await rl.hit('k', 2, 1000);
    expect((await rl.hit('k', 2, 1000)).ok).toBe(false);
    now = 1001; // first hit expired
    expect((await rl.hit('k', 2, 1000)).ok).toBe(true);
  });
});

describe('runAudit rate limits', () => {
  const services = (): Services => ({
    llm: new MockLLM(),
    email: new ConsoleEmail(),
    notifiers: [new ConsoleNotifier()],
    store: new MemoryLeadStore(),
    limiter: new MemoryRateLimiter(),
  });
  // Unresolvable host → the fetch fails fast; we only care about limiting.
  const fetchOptions = { resolver: async () => [] };
  const input = (url: string) => ({ url, name: 'Ana', email: 'ana@example.com', sector: 'otro', consent: true, locale: 'es' });

  it(`limits each IP to ${LIMITS.perIp.limit} audits per hour`, async () => {
    const s = services();
    for (let i = 0; i < LIMITS.perIp.limit; i++) {
      const r = await runAudit(input(`site${i}.example`), { services: s, ip: '203.0.113.7', fetchOptions });
      expect(r.status).not.toBe('rate_limited');
    }
    const r = await runAudit(input('another.example'), { services: s, ip: '203.0.113.7', fetchOptions });
    expect(r.status).toBe('rate_limited');
    const other = await runAudit(input('another.example'), { services: s, ip: '198.51.100.9', fetchOptions });
    expect(other.status).not.toBe('rate_limited');
  });

  it(`limits each domain to ${LIMITS.perDomain.limit} audits per day across IPs`, async () => {
    const s = services();
    for (let i = 0; i < LIMITS.perDomain.limit; i++) {
      const r = await runAudit(input('https://www.same.example'), { services: s, ip: `10.0.0.${i}`, fetchOptions });
      expect(r.status).not.toBe('rate_limited');
    }
    const r = await runAudit(input('same.example/otra'), { services: s, ip: '10.0.0.99', fetchOptions });
    expect(r.status).toBe('rate_limited');
  });

  it('still saves the lead when the site cannot be loaded', async () => {
    const s = services();
    const r = await runAudit(input('down.example'), { services: s, ip: '1.2.3.4', fetchOptions });
    expect(r.status).toBe('partial');
    const store = s.store as MemoryLeadStore;
    expect(store.leads).toHaveLength(1);
    expect(store.audits[0].status).toBe('fetch_failed');
  });

  it('stores the visit attribution with the lead (and drops junk keys)', async () => {
    const s = services();
    await runAudit(
      { ...input('attr.example'), attribution: { utm_source: 'meta', channel: 'paid_social', evil: 'x' } },
      { services: s, ip: '5.6.7.8', fetchOptions },
    );
    expect((s.store as MemoryLeadStore).leads[0].meta).toEqual({ attribution: { utm_source: 'meta', channel: 'paid_social' } });
  });

  it('honeypot submissions store nothing', async () => {
    const s = services();
    await runAudit({ ...input('bot.example'), company_site: 'spam' }, { services: s, ip: '1.2.3.4', fetchOptions });
    expect((s.store as MemoryLeadStore).leads).toHaveLength(0);
  });

  it('requires GDPR consent', async () => {
    const r = await runAudit({ ...input('x.example'), consent: false }, { services: services(), ip: '1.2.3.4', fetchOptions });
    expect(r).toMatchObject({ status: 'invalid', field: 'consent' });
  });
});
