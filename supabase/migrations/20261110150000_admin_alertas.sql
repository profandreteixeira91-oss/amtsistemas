-- Alertas de atendimento do Control Center (/admin), Fase 3 da evolução do /admin.
--
-- - admin_push_subscriptions: aparelhos (navegador/celular) que recebem os alertas por Web Push. Cada admin
--   gerencia os próprios aparelhos; a Edge Function admin-push lê todos com service_role.
-- - public.admin_notify(): chama a admin-push pelo pg_net com o segredo guardado no Vault (nome
--   'admin_push_secret'; criado fora da migration para o valor não ficar no repositório). Sem o segredo, não faz
--   nada. A função existe igual no projeto do Dojo (mensagens de WhatsApp e de chamados).
-- - Lead novo no funil (manager_leads) gera alerta.
-- Idempotente.

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  active boolean not null default true,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists admin_push_subscriptions_user_idx on public.admin_push_subscriptions (user_id) where active;
alter table public.admin_push_subscriptions enable row level security;

drop policy if exists "admins manage own push subscriptions" on public.admin_push_subscriptions;
create policy "admins manage own push subscriptions" on public.admin_push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()) and public.is_control_center_admin((select auth.uid())))
  with check (user_id = (select auth.uid()) and public.is_control_center_admin((select auth.uid())));

create or replace function public.admin_notify(p_title text, p_body text, p_url text, p_tag text)
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
    url := 'https://yqxmxevphdumyuwlvppg.supabase.co/functions/v1/admin-push',
    headers := jsonb_build_object('content-type', 'application/json', 'x-admin-push-secret', v_secret),
    body := jsonb_build_object('title', left(p_title, 120), 'body', left(coalesce(p_body, ''), 300), 'url', p_url, 'tag', p_tag)
  );
end $$;

revoke all on function public.admin_notify(text, text, text, text) from public, anon, authenticated;

create or replace function public.manager_leads_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_notify(
    'Novo lead · ' || case new.origem
      when 'site-contato' then 'formulário do site'
      when 'chat-site' then 'chat do site'
      when 'teste-gratis-amt-optione' then 'teste grátis OptiOne'
      when 'manual' then 'cadastro manual'
      else coalesce(new.origem, 'sem origem') end,
    coalesce(nullif(new.empresa, ''), new.nome) || coalesce(' · ' || left(new.observacoes, 120), ''),
    '/admin/leads?lead=' || new.id,
    'lead-' || new.id
  );
  return null;
end $$;

drop trigger if exists manager_leads_notify_admin on public.manager_leads;
create trigger manager_leads_notify_admin after insert on public.manager_leads
  for each row execute function public.manager_leads_notify_admin();
