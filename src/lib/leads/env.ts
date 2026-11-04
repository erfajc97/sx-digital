/* Server env access that works in `astro dev` (.env → import.meta.env),
   on Netlify Functions (process.env) and in vitest. */
const metaEnv: Record<string, string | undefined> =
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});

export function env(name: string): string | undefined {
  const v = process.env[name] ?? metaEnv[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

export function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(env(name) ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  get anthropicModel() {
    // Default: current Opus. For lower latency set ANTHROPIC_MODEL=claude-haiku-5-5.
    return env('ANTHROPIC_MODEL') ?? 'claude-opus-5-5';
  },
  get anthropicEffort(): 'low' | 'medium' | 'high' {
    const e = env('ANTHROPIC_EFFORT');
    return e === 'medium' || e === 'high' ? e : 'low';
  },
  get bookingUrl() {
    return env('BOOKING_URL') ?? 'https://cal.com/solvyxdigital/30min';
  },
  get salesEmail() {
    return env('SALES_NOTIFY_EMAIL') ?? 'contact@solvyxdigital.com';
  },
  get contactInbox() {
    // Recipient of the website contact form (kept from the previous function).
    return env('CONTACT_TO_EMAIL') ?? 'solvyxdigital@gmail.com';
  },
  get emailFrom() {
    return env('RESEND_FROM') ?? 'SolvyX <noreply@solvyxdigital.com>';
  },
  get ipHashSalt() {
    return env('IP_HASH_SALT') ?? 'solvyx-dev-salt';
  },
  /** Total time we allow /api/audit before answering (Netlify sync limit). */
  get auditBudgetMs() {
    return envInt('AUDIT_BUDGET_MS', 24_000);
  },
  get leadScoreThreshold() {
    return envInt('LEAD_SCORE_ALERT', 70);
  },
};
