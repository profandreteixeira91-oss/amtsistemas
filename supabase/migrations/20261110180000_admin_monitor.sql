-- Monitor automático do Control Center (/admin › Monitor), Fase 4 da evolução do /admin.
--
-- A cada 5 minutos o pg_cron chama a Edge Function admin-monitor (segredo 'admin_push_secret' do Vault, o mesmo
-- dos alertas), que verifica cada item, grava o resultado e manda alerta quando algo cai (2 falhas seguidas) e
-- quando volta. Admins do Control Center só leem; quem grava é a função (service_role).
-- Idempotente.

create table if not exists public.monitor_targets (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('http', 'evolution', 'supabase')),
  url text not null,
  system text,
  sort integer not null default 0,
  active boolean not null default true,
  status text not null default 'unknown' check (status in ('unknown', 'up', 'down')),
  consecutive_failures integer not null default 0,
  last_checked_at timestamptz,
  last_change_at timestamptz,
  last_response_ms integer,
  last_error text
);

create table if not exists public.monitor_checks (
  id bigserial primary key,
  target_id text not null references public.monitor_targets(id) on delete cascade,
  ok boolean not null,
  status_code integer,
  response_ms integer,
  error text,
  checked_at timestamptz not null default now()
);
create index if not exists monitor_checks_target_idx on public.monitor_checks (target_id, checked_at desc);

create table if not exists public.monitor_incidents (
  id bigserial primary key,
  target_id text not null references public.monitor_targets(id) on delete cascade,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  error text
);
create index if not exists monitor_incidents_started_idx on public.monitor_incidents (started_at desc);

alter table public.monitor_targets enable row level security;
alter table public.monitor_checks enable row level security;
alter table public.monitor_incidents enable row level security;

drop policy if exists "control center admins read monitor targets" on public.monitor_targets;
create policy "control center admins read monitor targets" on public.monitor_targets
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));
drop policy if exists "control center admins read monitor checks" on public.monitor_checks;
create policy "control center admins read monitor checks" on public.monitor_checks
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));
drop policy if exists "control center admins read monitor incidents" on public.monitor_incidents;
create policy "control center admins read monitor incidents" on public.monitor_incidents
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));

insert into public.monitor_targets (id, name, kind, url, system, sort) values
  ('site-amt', 'Site AMT Sistemas', 'http', 'https://amtsistemas.com.br/', 'amtsistemas', 1),
  ('optione-landing', 'AMT OptiOne · página e teste grátis', 'http', 'https://amtsistemas.com.br/optione', 'optione', 2),
  ('dojo-site', 'AMT Dojo Manager', 'http', 'https://amtdojomanager.com.br/dojo', 'dojo', 3),
  ('whatsapp-suporte', 'WhatsApp do suporte', 'evolution', 'amt-suporte', 'suporte', 4),
  ('banco-optione', 'Banco do AMT OptiOne', 'supabase', 'https://rragitmijwruydspafac.supabase.co', 'optione', 5),
  ('banco-dojo', 'Banco do Dojo Manager', 'supabase', 'https://gudjmkiyprgwgxmzbgji.supabase.co', 'dojo', 6)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, url = excluded.url, system = excluded.system, sort = excluded.sort;

-- Disponibilidade por item (24 h e 7 dias) para a tela do Monitor, sem trazer milhares de linhas ao navegador.
create or replace function public.monitor_uptime()
returns table (target_id text, uptime_24h numeric, uptime_7d numeric, avg_ms_24h integer, checks_24h bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.target_id,
         round(100.0 * count(*) filter (where c.ok and c.checked_at > now() - interval '24 hours')
               / nullif(count(*) filter (where c.checked_at > now() - interval '24 hours'), 0), 2),
         round(100.0 * count(*) filter (where c.ok) / nullif(count(*), 0), 2),
         (avg(c.response_ms) filter (where c.ok and c.checked_at > now() - interval '24 hours'))::integer,
         count(*) filter (where c.checked_at > now() - interval '24 hours')
  from public.monitor_checks c
  where c.checked_at > now() - interval '7 days'
    and public.is_control_center_admin((select auth.uid()))
  group by c.target_id
$$;
revoke all on function public.monitor_uptime() from public, anon;
grant execute on function public.monitor_uptime() to authenticated;

-- Linha do tempo das últimas 24 h (uma barra por hora) para cada item.
create or replace function public.monitor_timeline()
returns table (target_id text, hour timestamptz, total bigint, failures bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.target_id, date_trunc('hour', c.checked_at), count(*), count(*) filter (where not c.ok)
  from public.monitor_checks c
  where c.checked_at > now() - interval '24 hours'
    and public.is_control_center_admin((select auth.uid()))
  group by 1, 2
  order by 1, 2
$$;
revoke all on function public.monitor_timeline() from public, anon;
grant execute on function public.monitor_timeline() to authenticated;

create or replace function public.admin_monitor_tick()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'admin_push_secret' limit 1;
  if v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://yqxmxevphdumyuwlvppg.supabase.co/functions/v1/admin-monitor',
    headers := jsonb_build_object('content-type', 'application/json', 'x-admin-push-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end $$;
revoke all on function public.admin_monitor_tick() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'admin-monitor-every-5-minutes';
select cron.schedule('admin-monitor-every-5-minutes', '*/5 * * * *', $$ select public.admin_monitor_tick() $$);
