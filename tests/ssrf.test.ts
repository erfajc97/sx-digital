import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isBlockedIp, normalizeTargetUrl } from '@/lib/leads/net/ip-policy';
import { resolvePublic, safeFetch, SafeFetchError, type Resolver } from '@/lib/leads/net/safe-fetch';

describe('isBlockedIp', () => {
  it.each([
    '127.0.0.1', '127.8.9.10', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '198.18.0.1',
    '::1', '::', 'fe80::1', 'fc00::1', 'fd00:ec2::254', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:169.254.169.254',
    '64:ff9b::a9fe:a9fe', 'not-an-ip',
  ])('blocks %s', (ip) => expect(isBlockedIp(ip)).toBe(true));

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'])(
    'allows public %s',
    (ip) => expect(isBlockedIp(ip)).toBe(false),
  );
});

describe('normalizeTargetUrl', () => {
  it('adds https:// and drops the hash', () => {
    expect(normalizeTargetUrl('ejemplo.com/servicios#top').toString()).toBe('https://ejemplo.com/servicios');
  });
  it.each([
    'ftp://ejemplo.com',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'http://localhost:3000',
    'http://foo.localhost',
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://0x7f.1/',
    'http://2130706433/',
    'http://intranet/',
    'https://user:pass@ejemplo.com',
    'https://ejemplo.com:8443/',
  ])('rejects %s', (u) => expect(() => normalizeTargetUrl(u)).toThrow());
});

describe('resolvePublic (DNS resolved before connecting)', () => {
  const fake =
    (map: Record<string, string[]>): Resolver =>
    async (h) =>
      (map[h] ?? []).map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));

  it('accepts a host that resolves only to public IPs', async () => {
    await expect(resolvePublic('ok.example', fake({ 'ok.example': ['93.184.216.34'] }))).resolves.toMatchObject({
      address: '93.184.216.34',
    });
  });
  it('rejects when ANY resolved address is private (rebinding / split DNS)', async () => {
    await expect(resolvePublic('evil.example', fake({ 'evil.example': ['93.184.216.34', '10.0.0.5'] }))).rejects.toMatchObject({
      code: 'blocked',
    });
  });
  it('rejects hosts pointing at cloud metadata', async () => {
    await expect(resolvePublic('meta.example', fake({ 'meta.example': ['169.254.169.254'] }))).rejects.toMatchObject({ code: 'blocked' });
  });
  it('fails closed on DNS errors / empty answers', async () => {
    await expect(resolvePublic('nx.example', fake({}))).rejects.toMatchObject({ code: 'dns_failed' });
  });
});

describe('safeFetch against a local server', () => {
  let server: http.Server;
  let port = 0;
  // The tests talk to 127.0.0.1: this policy allows exactly that address (and
  // the test port) while every other private range stays blocked.
  const policy = (ip: string) => ip !== '127.0.0.1' && isBlockedIp(ip);
  const resolver: Resolver = async (h) => {
    if (h === 'site.test') return [{ address: '127.0.0.1', family: 4 }];
    if (h === 'rebind.test') return [{ address: '10.0.0.1', family: 4 }];
    throw new Error('nx');
  };
  const opts = () => ({ ipPolicy: policy, allowedPorts: [port], resolver, timeoutMs: 2_000 });

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = req.url ?? '/';
      const redirect = (code: number, location: string) => {
        res.writeHead(code, { location });
        res.end();
      };
      if (url === '/ok') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<html><title>Hola</title></html>');
      } else if (url === '/to-metadata') redirect(302, 'http://169.254.169.254/latest/meta-data/');
      else if (url === '/to-rebind') redirect(302, `http://rebind.test:${port}/ok`);
      else if (url.startsWith('/loop/')) redirect(301, `/loop/${Number(url.split('/')[2]) + 1}`);
      else if (url === '/hop2') redirect(302, '/hop1');
      else if (url === '/hop1') redirect(302, '/ok');
      else if (url === '/big') {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end('x'.repeat(50_000));
      } else if (url === '/slow') {
        setTimeout(() => res.end('late'), 3_000);
      } else if (url === '/pdf') {
        res.writeHead(200, { 'content-type': 'application/pdf' });
        res.end('%PDF');
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    port = (server.address() as AddressInfo).port;
  });
  afterAll(() => {
    server.closeAllConnections();
    return new Promise<void>((r) => server.close(() => r()));
  });

  it('fetches an allowed page', async () => {
    const res = await safeFetch(`http://site.test:${port}/ok`, opts());
    expect(res.status).toBe(200);
    expect(res.body).toContain('<title>Hola</title>');
  });

  it('follows redirects (≤3) and reports the final URL', async () => {
    const res = await safeFetch(`http://site.test:${port}/hop2`, opts());
    expect(res.finalUrl).toBe(`http://site.test:${port}/ok`);
    expect(res.redirects).toHaveLength(2);
  });

  it('stops after 3 redirects', async () => {
    await expect(safeFetch(`http://site.test:${port}/loop/0`, opts())).rejects.toMatchObject({ code: 'too_many_redirects' });
  });

  it('blocks a redirect to the metadata IP', async () => {
    await expect(safeFetch(`http://site.test:${port}/to-metadata`, opts())).rejects.toMatchObject({ code: 'blocked' });
  });

  it('re-resolves each hop and blocks a host that resolves privately', async () => {
    await expect(safeFetch(`http://site.test:${port}/to-rebind`, opts())).rejects.toMatchObject({ code: 'blocked' });
  });

  it('refuses loopback with the default policy', async () => {
    await expect(safeFetch(`http://127.0.0.1:${port}/ok`, { allowedPorts: [port] })).rejects.toBeInstanceOf(SafeFetchError);
  });

  it('caps the body at maxBytes', async () => {
    const res = await safeFetch(`http://site.test:${port}/big`, { ...opts(), maxBytes: 1_000 });
    expect(res.truncated).toBe(true);
    expect(res.body.length).toBe(1_000);
  });

  it('times out', async () => {
    await expect(safeFetch(`http://site.test:${port}/slow`, { ...opts(), timeoutMs: 300 })).rejects.toMatchObject({ code: 'timeout' });
  });

  it('rejects non-HTML responses and HTTP errors', async () => {
    await expect(safeFetch(`http://site.test:${port}/pdf`, opts())).rejects.toMatchObject({ code: 'not_html' });
    await expect(safeFetch(`http://site.test:${port}/missing`, opts())).rejects.toMatchObject({ code: 'http_error', status: 404 });
  });
});
