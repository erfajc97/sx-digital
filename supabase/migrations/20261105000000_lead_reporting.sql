-- Reporting views for the lead pipeline (read them in Supabase → Table editor
-- or SQL editor). Service role only, like the tables they read.

-- Channel of a lead: stored attribution → coarse group.
create or replace view public.leads_enriched with (security_invoker = true) as
select
  l.id,
  l.created_at,
  date_trunc('week', l.created_at)::date as week,
  l.source,
  lower(l.email) as email,
  l.name,
  l.sector,
  l.locale,
  coalesce(nullif(l.meta -> 'attribution' ->> 'channel', ''), 'unknown') as channel,
  l.meta -> 'attribution' ->> 'utm_source'   as utm_source,
  l.meta -> 'attribution' ->> 'utm_medium'   as utm_medium,
  l.meta -> 'attribution' ->> 'utm_campaign' as utm_campaign,
  l.meta -> 'attribution' ->> 'referrer'     as referrer,
  l.meta -> 'attribution' ->> 'landing'      as landing
from public.leads l;

-- Leads per week, by source (audit / contact / calcom) and channel.
create or replace view public.leads_weekly with (security_invoker = true) as
select week, source, channel, count(*) as leads
from public.leads_enriched
group by week, source, channel
order by week desc, leads desc;

-- Audit funnel per week: requested → report delivered → booked a call
-- (a Cal.com booking with the same email after the audit, within 30 days).
create or replace view public.audit_funnel_weekly with (security_invoker = true) as
with audit_leads as (
  select e.id, e.email, e.created_at, e.week, e.channel, a.status, a.lead_score
  from public.leads_enriched e
  left join public.audits a on a.lead_id = e.id
  where e.source = 'audit'
)
select
  week,
  count(*)                                              as audits_requested,
  count(*) filter (where status = 'completed')          as reports_delivered,
  count(*) filter (where status in ('fetch_failed', 'llm_failed')) as failed,
  count(*) filter (where lead_score >= 70)              as hot_leads,
  count(*) filter (where exists (
    select 1 from public.leads b
    where b.source = 'calcom'
      and lower(b.email) = audit_leads.email
      and b.created_at between audit_leads.created_at and audit_leads.created_at + interval '30 days'
  ))                                                    as booked_call,
  round(100.0 * count(*) filter (where exists (
    select 1 from public.leads b
    where b.source = 'calcom'
      and lower(b.email) = audit_leads.email
      and b.created_at between audit_leads.created_at and audit_leads.created_at + interval '30 days'
  )) / nullif(count(*), 0), 1)                          as booking_rate_pct
from audit_leads
group by week
order by week desc;

-- Which channels bring leads that actually book.
create or replace view public.channel_performance with (security_invoker = true) as
select
  e.channel,
  count(*) filter (where e.source <> 'calcom') as leads,
  count(distinct e.email) filter (where e.source = 'calcom') as bookings,
  min(e.created_at) as first_lead,
  max(e.created_at) as last_lead
from public.leads_enriched e
group by e.channel
order by leads desc;

revoke all on public.leads_enriched, public.leads_weekly, public.audit_funnel_weekly, public.channel_performance
  from anon, authenticated;
grant select on public.leads_enriched, public.leads_weekly, public.audit_funnel_weekly, public.channel_performance
  to service_role;
