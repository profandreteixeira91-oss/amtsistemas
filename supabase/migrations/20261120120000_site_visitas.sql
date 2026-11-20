-- Visitas do site (/admin › Visitas): contagem própria das páginas públicas de amtsistemas.com.br, sem cookies e
-- sem guardar IP.
--
-- O navegador avisa o Worker a cada página vista (/api/public/visita); o Worker descarta robôs e chama
-- site_track_visit, que grava só a página, a origem, o tipo de aparelho, o navegador, o sistema, o local
-- aproximado (país/estado/cidade, da Cloudflare) e um código de visitante. Esse código é um hash do IP + navegador
-- com um sal aleatório do dia, apagado no dia seguinte: conta visitantes únicos por dia, mas não identifica
-- ninguém nem liga a mesma pessoa entre dias. Admins do Control Center só leem; visitas com mais de 13 meses
-- são apagadas todo dia.
-- Idempotente.

create table if not exists public.site_visits (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  path text not null,
  entry boolean not null default false,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text not null check (device in ('mobile', 'tablet', 'desktop')),
  browser text,
  os text,
  country text,
  region text,
  city text,
  visitor_hash text not null
);
create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_idx on public.site_visits (visitor_hash, created_at desc);

-- Sal do dia (fuso de São Paulo). Sem políticas: só as funções abaixo leem.
create table if not exists public.site_visit_salts (
  day date primary key,
  salt bytea not null default extensions.gen_random_bytes(32)
);

alter table public.site_visits enable row level security;
alter table public.site_visit_salts enable row level security;

drop policy if exists "control center admins read site visits" on public.site_visits;
create policy "control center admins read site visits" on public.site_visits
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));

-- Chamada pelo Worker do site (chave publicável). O IP só entra no hash e não é gravado.
create or replace function public.site_track_visit(
  p_path text,
  p_entry boolean,
  p_referrer_host text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_device text,
  p_browser text,
  p_os text,
  p_country text,
  p_region text,
  p_city text,
  p_ip text,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_day date := (now() at time zone 'America/Sao_Paulo')::date;
  v_salt bytea;
  v_hash text;
  clean text[];
begin
  if p_path is null or left(p_path, 1) <> '/' or coalesce(p_ip, '') = '' then
    return;
  end if;

  insert into public.site_visit_salts (day) values (v_day) on conflict (day) do nothing;
  select salt into v_salt from public.site_visit_salts where day = v_day;
  delete from public.site_visit_salts where day < v_day - 1;

  v_hash := left(encode(extensions.digest(v_salt || convert_to(p_ip || '|' || coalesce(p_user_agent, ''), 'UTF8'), 'sha256'), 'hex'), 20);

  -- Trava contra enxurrada (script repetindo a chamada): no máximo 120 páginas por visitante por hora.
  if (select count(*) from public.site_visits
      where visitor_hash = v_hash and created_at > now() - interval '1 hour') >= 120 then
    return;
  end if;

  clean := array[
    nullif(left(trim(lower(p_referrer_host)), 120), ''),
    nullif(left(trim(p_utm_source), 80), ''),
    nullif(left(trim(p_utm_medium), 80), ''),
    nullif(left(trim(p_utm_campaign), 120), '')
  ];

  insert into public.site_visits (
    path, entry, referrer_host, utm_source, utm_medium, utm_campaign,
    device, browser, os, country, region, city, visitor_hash
  ) values (
    left(p_path, 300),
    coalesce(p_entry, false),
    clean[1], clean[2], clean[3], clean[4],
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device else 'desktop' end,
    nullif(left(p_browser, 40), ''),
    nullif(left(p_os, 40), ''),
    nullif(upper(left(p_country, 2)), ''),
    nullif(left(p_region, 80), ''),
    nullif(left(p_city, 80), ''),
    v_hash
  );
end $$;
revoke all on function public.site_track_visit(text, boolean, text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.site_track_visit(text, boolean, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Relatório do período para a tela de Visitas, já agregado (o navegador não baixa as linhas).
-- p_days = 1 é "hoje" (desde a meia-noite, por hora); acima disso, os últimos N dias contando hoje (por dia).
-- Traz também o período anterior de mesmo tamanho para comparação.
create or replace function public.site_visits_report(p_days integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 7), 400));
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_start timestamptz := ((v_today - (v_days - 1))::timestamp at time zone 'America/Sao_Paulo');
  v_prev_start timestamptz := ((v_today - (2 * v_days - 1))::timestamp at time zone 'America/Sao_Paulo');
  v_result jsonb;
begin
  if not public.is_control_center_admin((select auth.uid())) then
    raise exception 'Acesso restrito ao Control Center.' using errcode = '42501';
  end if;

  with cur as (
    select * from public.site_visits where created_at >= v_start
  ),
  prev as (
    select * from public.site_visits where created_at >= v_prev_start and created_at < v_start
  ),
  buckets as (
    select case when v_days = 1
             then date_trunc('hour', created_at at time zone 'America/Sao_Paulo')
             else date_trunc('day', created_at at time zone 'America/Sao_Paulo') end as t,
           visitor_hash
    from cur
  ),
  origins as (
    -- A origem vem da campanha (utm_source) ou, sem ela, do site que mandou o visitante; nomes conhecidos são
    -- agrupados ("instagram", "l.instagram.com" e "www.instagram.com" viram Instagram).
    select case
             when v is null then 'Direto'
             when v ~ '(^|\.)(chatgpt|openai|perplexity|claude|gemini|copilot)(\.|$)' then 'Assistentes de IA'
             when v ~ '(^|\.)google(\.|$)' then 'Google'
             when v ~ '(^|\.)bing(\.|$)' then 'Bing'
             when v ~ '(^|\.)(duckduckgo|yahoo|yandex|ecosia|brave)(\.|$)' then 'Outros buscadores'
             when v ~ '(^|\.)(instagram|ig)(\.|$)' then 'Instagram'
             when v ~ '(^|\.)(facebook|fb|meta)(\.|$)' then 'Facebook'
             when v ~ '(^|\.)(whatsapp|wa)(\.|$)' then 'WhatsApp'
             when v ~ '(^|\.)(linkedin|lnkd)(\.|$)' then 'LinkedIn'
             when v ~ '(^|\.)(youtube|youtu)(\.|$)' then 'YouTube'
             when v ~ '(^|\.)(tiktok)(\.|$)' then 'TikTok'
             else v
           end as source,
           visitor_hash
    from (select coalesce(lower(utm_source), referrer_host) as v, visitor_hash from cur where entry) o
  )
  select jsonb_build_object(
    'days', v_days,
    'start', v_start,
    'totals', (select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor_hash), 'entries', count(*) filter (where entry)) from cur),
    'previous', (select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor_hash), 'entries', count(*) filter (where entry)) from prev),
    'online', (select count(distinct visitor_hash) from public.site_visits where created_at > now() - interval '5 minutes'),
    'series', coalesce((select jsonb_agg(jsonb_build_object('t', t, 'views', views, 'visitors', visitors) order by t)
                        from (select t, count(*) as views, count(distinct visitor_hash) as visitors from buckets group by t) s), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('label', path, 'views', views, 'visitors', visitors) order by views desc, path)
                       from (select path, count(*) as views, count(distinct visitor_hash) as visitors from cur group by path order by 2 desc, 1 limit 15) s), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('label', source, 'views', views, 'visitors', visitors) order by views desc, source)
                         from (select source, count(*) as views, count(distinct visitor_hash) as visitors from origins group by source order by 2 desc, 1 limit 15) s), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'views', views, 'visitors', visitors) order by views desc, label)
                           from (select concat_ws(' · ', utm_campaign, utm_source, utm_medium) as label, count(*) as views, count(distinct visitor_hash) as visitors
                                 from cur where entry and utm_campaign is not null group by 1 order by 2 desc, 1 limit 10) s), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(jsonb_build_object('label', device, 'views', views, 'visitors', visitors) order by visitors desc, device)
                         from (select device, count(*) as views, count(distinct visitor_hash) as visitors from cur group by device) s), '[]'::jsonb),
    'browsers', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'views', views, 'visitors', visitors) order by visitors desc, label)
                          from (select coalesce(browser, 'Outro') as label, count(*) as views, count(distinct visitor_hash) as visitors from cur group by 1 order by 3 desc, 1 limit 8) s), '[]'::jsonb),
    'systems', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'views', views, 'visitors', visitors) order by visitors desc, label)
                         from (select coalesce(os, 'Outro') as label, count(*) as views, count(distinct visitor_hash) as visitors from cur group by 1 order by 3 desc, 1 limit 8) s), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'views', views, 'visitors', visitors) order by visitors desc, label)
                           from (select coalesce(country, '??') as label, count(*) as views, count(distinct visitor_hash) as visitors from cur group by 1 order by 3 desc, 1 limit 10) s), '[]'::jsonb),
    'cities', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'views', views, 'visitors', visitors) order by visitors desc, label)
                        from (select concat_ws(' · ', city, region) as label, count(*) as views, count(distinct visitor_hash) as visitors
                              from cur where city is not null group by 1 order by 3 desc, 1 limit 10) s), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;
revoke all on function public.site_visits_report(integer) from public, anon;
grant execute on function public.site_visits_report(integer) to authenticated;

-- Limpeza diária: visitas com mais de 13 meses.
select cron.unschedule(jobid) from cron.job where jobname = 'site-visits-retention';
select cron.schedule('site-visits-retention', '17 4 * * *', $$ delete from public.site_visits where created_at < now() - interval '13 months' $$);
