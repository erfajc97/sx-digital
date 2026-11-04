-- SolvyX lead pipeline: leads (audit / contact / calcom), AI audits and
-- rate-limit buckets. Only the server (service_role key) reads or writes:
-- RLS is enabled with NO policies, so anon/authenticated get nothing.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- leads
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  source      text not null check (source in ('audit', 'contact', 'calcom')),
  email       text not null check (char_length(email) <= 254),
  name        text check (char_length(name) <= 160),
  company     text check (char_length(company) <= 200),
  website     text check (char_length(website) <= 2048),
  sector      text check (char_length(sector) <= 80),
  message     text check (char_length(message) <= 4000),
  locale      text not null default 'es' check (locale in ('es', 'en')),
  consent     boolean not null default false,
  consent_at  timestamptz,
  meta        jsonb not null default '{}'::jsonb
);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_source_created_idx on public.leads (source, created_at desc);

-- --------------------------------------------------------------- audits
create table if not exists public.audits (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  lead_id         uuid references public.leads (id) on delete cascade,
  url             text not null check (char_length(url) <= 2048),
  domain          text not null check (char_length(domain) <= 253),
  status          text not null check (status in ('completed', 'fetch_failed', 'llm_failed')),
  signals         jsonb,
  report          jsonb,
  puntuacion_web  smallint check (puntuacion_web between 0 and 100),
  lead_score      smallint check (lead_score between 0 and 100),
  error           text,
  ip_hash         text,
  locale          text not null default 'es' check (locale in ('es', 'en'))
);
create index if not exists audits_lead_idx on public.audits (lead_id);
create index if not exists audits_domain_created_idx on public.audits (domain, created_at desc);
create index if not exists audits_hot_idx on public.audits (lead_score desc) where status = 'completed';

-- ------------------------------------------------------ rate-limit hits
create table if not exists public.rate_limit_hits (
  id          bigint generated always as identity primary key,
  key         text not null check (char_length(key) <= 300),
  created_at  timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_created_idx on public.rate_limit_hits (key, created_at desc);

-- ----------------------------------------------------------------- RLS
alter table public.leads enable row level security;
alter table public.audits enable row level security;
alter table public.rate_limit_hits enable row level security;
alter table public.leads force row level security;
alter table public.audits force row level security;
alter table public.rate_limit_hits force row level security;

revoke all on public.leads, public.audits, public.rate_limit_hits from anon, authenticated;
grant all on public.leads, public.audits, public.rate_limit_hits to service_role;
grant usage, select on sequence public.rate_limit_hits_id_seq to service_role;

-- Handy view for sales (service_role / dashboard only).
create or replace view public.hot_leads with (security_invoker = true) as
select a.created_at, l.name, l.email, a.domain, a.puntuacion_web, a.lead_score,
       a.report ->> 'resumen_para_ventas' as resumen_para_ventas, a.id as audit_id
from public.audits a
join public.leads l on l.id = a.lead_id
where a.status = 'completed'
order by a.lead_score desc nulls last, a.created_at desc;
revoke all on public.hot_leads from anon, authenticated;

-- --------------------------------------------- retention (privacy policy)
create or replace function public.purge_rate_limit_hits() returns void
language sql security definer set search_path = public as $$
  delete from public.rate_limit_hits where created_at < now() - interval '30 days';
$$;
revoke all on function public.purge_rate_limit_hits() from public, anon, authenticated;

-- Daily purge via pg_cron (enable "pg_cron" in Database → Extensions first).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('purge-rate-limit-hits', '17 3 * * *', 'select public.purge_rate_limit_hits()');
  end if;
end $$;
