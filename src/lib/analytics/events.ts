/* Event catalogue + click classification. Pure (no DOM) so it is testable;
   the browser script feeds it plain data read from the clicked element. */

export type EventName =
  | 'audit_cta_click'
  | 'audit_form_start'
  | 'audit_submitted'
  | 'audit_result'
  | 'audit_result_view'
  | 'booking_click'
  | 'booking_completed'
  | 'contact_open'
  | 'contact_submitted'
  | 'whatsapp_click'
  | 'phone_click'
  | 'email_click'
  | 'social_click'
  | 'service_selected'
  | 'lang_switch'
  | 'nav_click'
  | 'scroll_depth'
  | 'chat_opened'
  | 'chat_quick_reply'
  | 'chat_audit_run'
  | 'chat_demo_started'
  | 'chat_lead_captured'
  | 'chat_booking_click'
  | 'chat_whatsapp_handoff';

export interface ClickInfo {
  href?: string | null;
  /** data-* attributes of the clicked element (or its closest link/button). */
  data: Record<string, string | undefined>;
  text?: string;
  /** Section the element lives in (closest section id), for "where" analysis. */
  section?: string | null;
  inNav?: boolean;
  pressed?: boolean;
}

export interface TrackedEvent {
  name: EventName;
  props: Record<string, string | number | boolean>;
}

const SOCIAL = /linkedin\.com|instagram\.com|facebook\.com|tiktok\.com|youtube\.com|(?:^|\/\/)(?:www\.)?(?:x|twitter)\.com/i;

export function classifyClick(c: ClickInfo): TrackedEvent | null {
  const where = { section: c.section ?? 'unknown' };
  const href = (c.href ?? '').trim();

  if (c.data.service !== undefined) {
    return { name: 'service_selected', props: { ...where, service: c.data.service, selected: Boolean(c.pressed) } };
  }
  if (c.data.calLink !== undefined || /(^|\/\/)(app\.)?cal\.com\//i.test(href) || /\/(agendar|book)\/?$/.test(href)) {
    return { name: 'booking_click', props: { ...where, label: (c.text ?? '').slice(0, 60) } };
  }
  if (c.data.openContact !== undefined) {
    return { name: 'contact_open', props: { ...where, project: c.data.project ?? '' } };
  }
  if (c.data.langSwitch !== undefined) return { name: 'lang_switch', props: { ...where, to: c.data.langSwitch } };
  if (/wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) return { name: 'whatsapp_click', props: where };
  if (/^tel:/i.test(href)) return { name: 'phone_click', props: where };
  if (/^mailto:/i.test(href)) return { name: 'email_click', props: where };
  if (/\/(auditoria|en\/audit)\/?$/.test(href.split(/[?#]/)[0])) {
    return { name: 'audit_cta_click', props: { ...where, label: (c.text ?? '').slice(0, 60) } };
  }
  if (SOCIAL.test(href)) {
    const network = href.match(/(linkedin|instagram|facebook|tiktok|youtube|twitter|x)\.com/i)?.[1]?.toLowerCase() ?? 'other';
    return { name: 'social_click', props: { ...where, network } };
  }
  if (c.inNav && href) return { name: 'nav_click', props: { target: href.slice(0, 80) } };
  return null;
}

/** Scroll milestones not yet reported for `percent` (e.g. 62 → [25, 50]). */
export function newScrollMilestones(percent: number, reported: Set<number>): number[] {
  return [25, 50, 75, 100].filter((m) => percent >= m && !reported.has(m));
}
