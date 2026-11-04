/* Server-side fetcher for untrusted URLs (SSRF-hardened).

   - http/https only, ports 80/443, no credentials, no internal hostnames.
   - DNS is resolved BEFORE connecting; every returned address is checked and
     the socket is pinned to the validated IP (custom `lookup`), so a second
     resolution can't swap in a private address (DNS rebinding).
   - Redirects are followed manually (max 3) and each hop is re-validated.
   - Hard overall timeout (8 s) and a 2 MB cap on the decoded body. */
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import zlib from 'node:zlib';
import type { LookupFunction } from 'node:net';
import { assertUrlAllowed, isBlockedIp, UrlPolicyError, type UrlPolicyOptions } from './ip-policy';

export type SafeFetchErrorCode =
  | 'invalid_url'
  | 'blocked'
  | 'dns_failed'
  | 'timeout'
  | 'too_many_redirects'
  | 'http_error'
  | 'not_html'
  | 'network';

export class SafeFetchError extends Error {
  constructor(
    public readonly code: SafeFetchErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export type Resolver = (hostname: string) => Promise<ResolvedAddress[]>;

const defaultResolver: Resolver = async (hostname) => {
  const res = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  return res.map((r) => ({ address: r.address, family: r.family === 6 ? 6 : 4 }));
};

export interface SafeFetchOptions extends UrlPolicyOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  resolver?: Resolver;
  userAgent?: string;
}

export interface SafeFetchResult {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
  truncated: boolean;
  redirects: string[];
  /** Time to response headers of the final hop. */
  responseMs: number;
  totalMs: number;
  headers: Record<string, string>;
}

/** Resolves `hostname` and refuses if ANY address is private/reserved. */
export async function resolvePublic(
  hostname: string,
  resolver: Resolver = defaultResolver,
  ipPolicy: (ip: string) => boolean = isBlockedIp,
): Promise<ResolvedAddress> {
  const host = hostname.replace(/^\[|\]$/g, '');
  const literal = net.isIP(host);
  if (literal) {
    if (ipPolicy(host)) throw new SafeFetchError('blocked', 'ip_not_allowed');
    return { address: host, family: literal === 6 ? 6 : 4 };
  }
  let addrs: ResolvedAddress[];
  try {
    addrs = await resolver(host);
  } catch {
    throw new SafeFetchError('dns_failed', 'dns_failed');
  }
  if (addrs.length === 0) throw new SafeFetchError('dns_failed', 'dns_failed');
  if (addrs.some((a) => ipPolicy(a.address))) throw new SafeFetchError('blocked', 'resolves_to_private_ip');
  return addrs[0];
}

interface HopResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  body?: Buffer;
  truncated?: boolean;
  headersMs: number;
}

function requestOnce(
  url: URL,
  pinned: ResolvedAddress,
  opts: Required<Pick<SafeFetchOptions, 'maxBytes' | 'userAgent'>>,
  signal: AbortSignal,
  readBody: (status: number, headers: http.IncomingHttpHeaders) => boolean,
): Promise<HopResult> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    // Pin the connection to the already-validated address.
    const lookup: LookupFunction = (_host, options, cb) => {
      if ((options as { all?: boolean }).all) {
        (cb as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, [
          { address: pinned.address, family: pinned.family },
        ]);
      } else {
        cb(null, pinned.address, pinned.family);
      }
    };
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(
      url,
      {
        method: 'GET',
        agent: false,
        lookup,
        signal,
        headers: {
          'User-Agent': opts.userAgent,
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'Accept-Language': 'es,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const headersMs = Date.now() - started;
        if (!readBody(status, res.headers)) {
          res.resume();
          resolve({ status, headers: res.headers, headersMs });
          return;
        }
        const enc = String(res.headers['content-encoding'] ?? '').toLowerCase().trim();
        let stream: NodeJS.ReadableStream = res;
        if (enc === 'gzip' || enc === 'x-gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        const chunks: Buffer[] = [];
        let size = 0;
        let done = false;
        const finish = (truncated: boolean) => {
          if (done) return;
          done = true;
          resolve({ status, headers: res.headers, body: Buffer.concat(chunks), truncated, headersMs });
        };
        stream.on('data', (chunk: Buffer) => {
          if (done) return;
          const room = opts.maxBytes - size;
          if (chunk.length >= room) {
            chunks.push(chunk.subarray(0, room));
            size += room;
            finish(true);
            req.destroy(); // stop downloading (also defuses decompression bombs)
            return;
          }
          chunks.push(chunk);
          size += chunk.length;
        });
        stream.on('end', () => finish(false));
        stream.on('error', (err) => {
          if (done) return;
          done = true;
          reject(err);
        });
      },
    );
    req.on('error', (err) => reject(err));
    req.end();
  });
}

function decode(body: Buffer, contentType: string): string {
  const m = contentType.match(/charset=["']?([\w-]+)/i);
  let label = m?.[1]?.toLowerCase() ?? 'utf-8';
  if (!m) {
    const head = body.subarray(0, 2048).toString('latin1');
    const meta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i);
    if (meta) label = meta[1].toLowerCase();
  }
  try {
    return new TextDecoder(label).decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}

export async function safeFetch(input: string | URL, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
  const maxRedirects = options.maxRedirects ?? 3;
  const resolver = options.resolver ?? defaultResolver;
  const ipPolicy = options.ipPolicy ?? isBlockedIp;
  const userAgent = options.userAgent ?? 'SolvyX-AuditBot/1.0 (+https://solvyxdigital.com/auditoria)';
  const policy: UrlPolicyOptions = { allowedPorts: options.allowedPorts, ipPolicy };

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let current: URL;
  try {
    current = assertUrlAllowed(new URL(String(input)), policy);
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof UrlPolicyError) throw new SafeFetchError(e.message === 'invalid_url' ? 'invalid_url' : 'blocked', e.message);
    throw new SafeFetchError('invalid_url', 'invalid_url');
  }
  const original = current.toString();
  const redirects: string[] = [];

  try {
    for (let hop = 0; ; hop++) {
      const pinned = await resolvePublic(current.hostname, resolver, ipPolicy);
      const res = await requestOnce(current, pinned, { maxBytes, userAgent }, controller.signal, (status) =>
        !(status >= 300 && status < 400),
      );

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.location;
        if (!location) throw new SafeFetchError('http_error', 'redirect_without_location', res.status);
        if (hop >= maxRedirects) throw new SafeFetchError('too_many_redirects', 'too_many_redirects');
        let next: URL;
        try {
          next = assertUrlAllowed(new URL(location, current), policy);
        } catch (e) {
          throw new SafeFetchError('blocked', e instanceof Error ? e.message : 'redirect_blocked');
        }
        redirects.push(next.toString());
        current = next;
        continue;
      }

      const contentType = String(res.headers['content-type'] ?? '');
      if (res.status >= 400) throw new SafeFetchError('http_error', `http_${res.status}`, res.status);
      if (contentType && !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
        throw new SafeFetchError('not_html', 'not_html', res.status);
      }
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(res.headers)) {
        if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
      }
      return {
        url: original,
        finalUrl: current.toString(),
        status: res.status,
        contentType,
        body: decode(res.body ?? Buffer.alloc(0), contentType),
        truncated: Boolean(res.truncated),
        redirects,
        responseMs: res.headersMs,
        totalMs: Date.now() - started,
        headers,
      };
    }
  } catch (e) {
    if (e instanceof SafeFetchError) throw e;
    if (controller.signal.aborted) throw new SafeFetchError('timeout', 'timeout');
    throw new SafeFetchError('network', e instanceof Error ? e.message : 'network');
  } finally {
    clearTimeout(timer);
  }
}
