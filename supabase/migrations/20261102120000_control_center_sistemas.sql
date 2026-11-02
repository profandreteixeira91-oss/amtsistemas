-- Control Center (/admin) trabalhando com os sistemas atuais: AMT OptiOne e AMT Dojo Manager.
--
-- 1. O /admin entra com admin_users (não com super_admins). Desde 28/10/2026 o site e o /admin dividem o
--    projeto amt-sistemas, então as tabelas da central de desenvolvimento não podem continuar liberadas para
--    qualquer login: passam a exigir um admin ativo do Control Center.
-- 2. Admins do Control Center leem o catálogo (manager_sistemas/manager_planos, inclusive inativos) e os leads
--    comerciais (manager_leads), onde caem os testes grátis do AMT OptiOne feitos pelo site.
-- 3. Projetos da central de desenvolvimento e catálogo atualizados para os sistemas atuais.
--
-- Idempotente.

create or replace function public.is_control_center_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = _user_id and active = true)
$$;

revoke all on function public.is_control_center_admin(uuid) from public, anon;
grant execute on function public.is_control_center_admin(uuid) to authenticated;

-- 1. Central de desenvolvimento só para admins do Control Center.
drop policy if exists "development_projects_authenticated" on public.development_projects;
drop policy if exists "development_issues_authenticated" on public.development_issues;
drop policy if exists "development_changes_authenticated" on public.development_changes;
drop policy if exists "development_deployments_authenticated" on public.development_deployments;
drop policy if exists "system_health_checks_authenticated" on public.system_health_checks;
drop policy if exists "authenticated can insert development ai runs" on public.development_ai_runs;
drop policy if exists "authenticated can read development ai runs" on public.development_ai_runs;
drop policy if exists "authenticated can update development_ai_runs" on public.development_ai_runs;

do $$
declare
  t text;
begin
  foreach t in array array[
    'development_projects', 'development_issues', 'development_changes', 'development_deployments',
    'development_ai_runs', 'system_health_checks'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'control center admins manage ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using (public.is_control_center_admin((select auth.uid()))) '
      'with check (public.is_control_center_admin((select auth.uid())))',
      'control center admins manage ' || t, t
    );
  end loop;
end $$;

-- 2. Catálogo e leads comerciais visíveis no Control Center.
drop policy if exists "control center admins read sistemas" on public.manager_sistemas;
create policy "control center admins read sistemas" on public.manager_sistemas
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));

drop policy if exists "control center admins read planos" on public.manager_planos;
create policy "control center admins read planos" on public.manager_planos
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));

drop policy if exists "control center admins read leads" on public.manager_leads;
create policy "control center admins read leads" on public.manager_leads
  for select to authenticated using (public.is_control_center_admin((select auth.uid())));

drop policy if exists "control center admins update leads" on public.manager_leads;
create policy "control center admins update leads" on public.manager_leads
  for update to authenticated
  using (public.is_control_center_admin((select auth.uid())))
  with check (public.is_control_center_admin((select auth.uid())));

-- 3. Projetos da central de desenvolvimento.
update public.development_projects
set status = 'arquivado', updated_at = now()
where system_id in ('ab-academy', 'fight-wear') and status <> 'arquivado';

update public.development_projects
set description = 'SaaS de gestão para academias de artes marciais, dojos e estúdios de treino.',
    repository = 'profandreteixeira91-oss/amtdojomanager',
    branch = 'main',
    production_url = 'https://amtdojomanager.com.br/dojo',
    stack = 'TanStack Start + React 19 + Supabase + Cloudflare Workers',
    status = 'ativo',
    updated_at = now()
where system_id = 'dojo-manager';

insert into public.development_projects (system_id, name, description, repository, branch, production_url, stack, status)
select 'optione',
       'AMT OptiOne',
       'Sistema de gestão para óticas: aplicativo desktop multi-loja, vendido com teste grátis pelo site.',
       'profandreteixeira91-oss/gestao_otica',
       'main',
       'https://amtsistemas.com.br/optione',
       'Python + PySide6 (desktop) + Supabase',
       'ativo'
where not exists (select 1 from public.development_projects where system_id = 'optione');

update public.development_projects
set production_url = 'https://amtsistemas.com.br', updated_at = now()
where system_id = 'amt-sistemas' and production_url is null;

-- Catálogo: o Dojo Manager saiu de dojo.amtsistemas.com.br (fora do ar) para amtdojomanager.com.br.
update public.manager_sistemas
set url = 'https://amtdojomanager.com.br', dominio = 'amtdojomanager.com.br', updated_at = now()
where slug = 'amt-dojo-manager' and dominio = 'dojo.amtsistemas.com.br';
