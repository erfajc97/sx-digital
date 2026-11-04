/* Small helpers shared by the API routes. */

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
}

/** Parses JSON, urlencoded or multipart bodies into a plain object. */
export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) {
      const v = await request.json();
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    }
    const form = await request.formData();
    return Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  } catch {
    return null;
  }
}

/** Client IP: Netlify header first, then common proxies, then Astro's value. */
export function clientIp(request: Request, fallback?: string): string {
  const h = request.headers;
  return (
    h.get('x-nf-client-connection-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    fallback ??
    'unknown'
  );
}

/** Rejects cross-site form posts (browsers always send Origin on POST). */
export function sameOrigin(request: Request, siteUrl: URL): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients; rate limit still applies
  try {
    const o = new URL(origin);
    return o.host === siteUrl.host || o.hostname === 'localhost' || o.hostname === '127.0.0.1' || o.hostname.endsWith('.netlify.app');
  } catch {
    return false;
  }
}
