-- Solvy chatbot: leads captured in the chat + anonymous transcripts.

-- 1) Leads from the chat share the leads table (source = 'chat').
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('audit', 'contact', 'calcom', 'chat'));

-- 2) Anonymous transcripts (emails/phones redacted by the server before
--    insert), kept 30 days to improve the bot. One row per chat session.
create table if not exists public.chat_sessions (
  id          uuid primary key,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '30 days'),
  locale      text not null default 'es' check (locale in ('es', 'en')),
  messages    jsonb not null default '[]'::jsonb,
  meta        jsonb not null default '{}'::jsonb
);
create index if not exists chat_sessions_expires_idx on public.chat_sessions (expires_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_sessions force row level security;
revoke all on public.chat_sessions from anon, authenticated;
grant all on public.chat_sessions to service_role;

create or replace function public.purge_chat_sessions() returns void
language sql security definer set search_path = public as $$
  delete from public.chat_sessions where expires_at < now();
$$;
revoke all on function public.purge_chat_sessions() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-chat-sessions', '27 3 * * *', 'select public.purge_chat_sessions()');
  end if;
end $$;

-- Sales view: chat leads with their qualification.
create or replace view public.chat_leads with (security_invoker = true) as
select l.created_at, l.name, l.email, l.company, l.sector, l.message as problema,
       l.meta ->> 'urgencia' as urgencia, l.meta ->> 'presupuesto' as presupuesto,
       (l.meta ->> 'puntuacion')::int as puntuacion, l.meta ->> 'resumen' as resumen,
       l.website, l.meta ->> 'trigger' as trigger, l.id
from public.leads l
where l.source = 'chat'
order by l.created_at desc;
revoke all on public.chat_leads from anon, authenticated;
