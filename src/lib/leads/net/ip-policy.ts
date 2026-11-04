/* SSRF guard: which IPs and URLs the audit fetcher may connect to. */
import net from 'node:net';

const blocked = new net.BlockList();

// IPv4 — "this network", private, CGNAT, loopback, link-local (cloud metadata
// 169.254.169.254), IETF/test ranges, benchmarking, multicast, reserved.
for (const [addr, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(addr, prefix, 'ipv4');
}

// IPv6 — unspecified, loopback, NAT64, discard, Teredo, docs, 6to4,
// unique-local (fc00::/7, incl. AWS fd00:ec2::254), link-local, multicast.
for (const [addr, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(addr, prefix, 'ipv6');
}

/** IPv4-mapped / compatible IPv6 (::ffff:a.b.c.d, ::ffff:7f00:1) → IPv4 string. */
function mappedV4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^(?:0*:)*:?(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^(?:0*:)*:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

/** True if connecting to `ip` must be refused. Unparseable input is blocked. */
export function isBlockedIp(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '').split('%')[0];
  const family = net.isIP(clean);
  if (family === 4) return blocked.check(clean, 'ipv4');
  if (family === 6) {
    const v4 = mappedV4(clean);
    if (v4) return blocked.check(v4, 'ipv4');
    return blocked.check(clean, 'ipv6');
  }
  return true;
}

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa', '.intranet', '.corp'];

export class UrlPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlPolicyError';
  }
}

export interface UrlPolicyOptions {
  allowedPorts?: number[];
  ipPolicy?: (ip: string) => boolean;
}

/** Normalises user input (adds https://) and enforces scheme/host/port rules. */
export function normalizeTargetUrl(input: string, opts: UrlPolicyOptions = {}): URL {
  const raw = input.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new UrlPolicyError('invalid_url');
  }
  return assertUrlAllowed(url, opts);
}

export function assertUrlAllowed(url: URL, opts: UrlPolicyOptions = {}): URL {
  const allowedPorts = opts.allowedPorts ?? [80, 443];
  const isBlocked = opts.ipPolicy ?? isBlockedIp;

  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new UrlPolicyError('protocol_not_allowed');
  if (url.username || url.password) throw new UrlPolicyError('credentials_not_allowed');

  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
  if (!allowedPorts.includes(port)) throw new UrlPolicyError('port_not_allowed');

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) throw new UrlPolicyError('invalid_url');
  if (host === 'localhost' || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new UrlPolicyError('host_not_allowed');
  }
  if (net.isIP(host)) {
    if (isBlocked(host)) throw new UrlPolicyError('ip_not_allowed');
  } else if (!host.includes('.')) {
    // Single-label names only resolve on internal DNS.
    throw new UrlPolicyError('host_not_allowed');
  }
  url.hash = '';
  return url;
}
