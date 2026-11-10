-- Leads e contatos unificados no Control Center (/admin › Leads), Fase 2 da evolução do /admin.
--
-- manager_leads (a mesma tabela do CRM e dos testes grátis do AMT OptiOne) passa a ser o funil único:
-- - Formulário de contato do site (contatos_leads): cada envio vira lead (origem "site-contato") por gatilho.
--   Contato repetido (mesmo e-mail ou telefone, lead ainda aberto nos últimos 90 dias) só ganha uma anotação.
-- - Chat do site: o servidor do site cria o lead (origem "chat-site") com a referência da conversa.
-- - canal_ref liga o lead à origem: "contato:<id de contatos_leads>" ou "whatsapp:<id da conversa>".
-- Admins do Control Center ganham cadastro e exclusão de leads e a leitura dos envios do formulário.
-- Idempotente.

alter table public.manager_leads add column if not exists canal_ref text;
create index if not exists manager_leads_canal_ref_idx on public.manager_leads (canal_ref);

drop policy if exists "control center admins insert leads" on public.manager_leads;
create policy "control center admins insert leads" on public.manager_leads
  for insert to authenticated with check (public.is_control_center_admin((select auth.uid())));

drop policy if exists "control center admins delete leads" on public.manager_leads;
create policy "control center admins delete leads" on public.manager_leads
  for delete to authenticated using (public.is_control_center_admin((select auth.uid())));

drop policy if exists "control center admins read contatos" on public.contatos_leads;
create policy "control center admins read contatos" on public.contatos_leads
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));

create or replace function public.contatos_leads_to_manager_leads(c public.contatos_leads)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead uuid;
  v_phone text := nullif(regexp_replace(coalesce(c.telefone, ''), '\D', '', 'g'), '');
  v_note text := concat_ws(E'\n', nullif(c.segmento, '') || ' · formulário do site', c.mensagem);
begin
  if exists (select 1 from public.manager_leads where canal_ref = 'contato:' || c.id) then
    return null;
  end if;
  select id into v_lead
  from public.manager_leads
  where status not in ('ganho', 'perdido')
    and created_at > now() - interval '90 days'
    and ((c.email is not null and lower(email) = lower(c.email))
      or (v_phone is not null and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = v_phone))
  order by created_at desc
  limit 1;
  if v_lead is not null then
    update public.manager_leads
    set observacoes = concat_ws(E'\n\n', observacoes, 'Novo contato pelo site em ' || to_char(c.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY') || ':' || E'\n' || v_note),
        updated_at = now()
    where id = v_lead;
    return v_lead;
  end if;
  insert into public.manager_leads (nome, empresa, email, telefone, origem, status, observacoes, canal_ref)
  values (c.nome, nullif(c.empresa, ''), c.email, c.telefone, 'site-contato', 'novo', v_note, 'contato:' || c.id)
  returning id into v_lead;
  return v_lead;
end $$;

revoke all on function public.contatos_leads_to_manager_leads(public.contatos_leads) from public, anon, authenticated;

create or replace function public.contatos_leads_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.contatos_leads_to_manager_leads(new);
  return null;
end $$;

drop trigger if exists contatos_leads_to_manager_leads on public.contatos_leads;
create trigger contatos_leads_to_manager_leads after insert on public.contatos_leads
  for each row execute function public.contatos_leads_after_insert();

-- Envios que já existiam também entram no funil.
do $$
declare r public.contatos_leads;
begin
  for r in select * from public.contatos_leads order by created_at loop
    perform public.contatos_leads_to_manager_leads(r);
  end loop;
end $$;
