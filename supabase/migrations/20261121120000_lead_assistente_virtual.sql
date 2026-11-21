-- Leads do Assistente Virtual AMT Sistemas (bot do WhatsApp, Edge Function support-inbox no projeto do Dojo).
--
-- O bot chama public.bot_upsert_lead pela API REST deste projeto com a chave pública e o segredo
-- 'bot_lead_secret' (Vault aqui; BOT_LEAD_SECRET nos segredos do projeto do Dojo). Sem o segredo certo, nada
-- acontece. Mesma regra de duplicidade do formulário do site: a conversa já tem lead aberto (canal_ref) ou o mesmo
-- telefone tem um lead aberto dos últimos 90 dias -> acrescenta a observação; senão cria (origem 'bot-whatsapp').
-- A criação dispara o alerta de lead novo (trigger manager_leads_notify_admin).
-- Idempotente.

create or replace function public.bot_upsert_lead(
  p_secret text,
  p_chat_id text,
  p_nome text,
  p_telefone text,
  p_sistema_slug text,
  p_observacoes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_lead uuid;
  v_ref text := 'whatsapp:' || left(coalesce(p_chat_id, ''), 64);
  v_phone text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
  v_sistema uuid;
  v_note text := left(coalesce(p_observacoes, ''), 2000);
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'bot_lead_secret' limit 1;
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  if coalesce(p_chat_id, '') = '' then
    raise exception 'conversa não informada' using errcode = '22023';
  end if;

  select id into v_sistema from public.manager_sistemas where slug = p_sistema_slug limit 1;

  select id into v_lead
  from public.manager_leads
  where status not in ('ganho', 'perdido')
    and (canal_ref = v_ref
      or (v_phone is not null and created_at > now() - interval '90 days'
          and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = v_phone))
  order by (canal_ref = v_ref) desc, created_at desc
  limit 1;

  if v_lead is not null then
    update public.manager_leads
    set observacoes = concat_ws(E'\n\n', observacoes,
          'Assistente virtual em ' || to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || ':' || E'\n' || v_note),
        sistema_interesse_id = coalesce(sistema_interesse_id, v_sistema),
        canal_ref = coalesce(canal_ref, v_ref),
        updated_at = now()
    where id = v_lead;
    return v_lead;
  end if;

  insert into public.manager_leads (nome, telefone, origem, status, sistema_interesse_id, observacoes, canal_ref)
  values (left(coalesce(nullif(trim(p_nome), ''), 'Contato do WhatsApp'), 120), left(p_telefone, 40), 'bot-whatsapp', 'novo', v_sistema, v_note, v_ref)
  returning id into v_lead;
  return v_lead;
end $$;

revoke all on function public.bot_upsert_lead(text, text, text, text, text, text) from public;
grant execute on function public.bot_upsert_lead(text, text, text, text, text, text) to anon, authenticated;
