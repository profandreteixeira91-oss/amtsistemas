-- AMT Control Center - initial admin authorization and audit
-- Execute this migration in the Supabase project "amt-sistemas".
-- The Auth user itself must be created/invited through Supabase Auth.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin'
    check (role in ('admin', 'developer', 'commercial', 'support')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "admins can read their own admin profile" on public.admin_users;
create policy "admins can read their own admin profile"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "admins can read audit logs" on public.audit_logs;
create policy "admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.active = true
  )
);

drop policy if exists "admins can insert audit logs" on public.audit_logs;
create policy "admins can insert audit logs"
on public.audit_logs
for insert
to authenticated
with check ((select auth.uid()) = actor_user_id);

grant select on public.admin_users to authenticated;
grant select, insert on public.audit_logs to authenticated;

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_user_id_idx
  on public.audit_logs (actor_user_id);

comment on table public.admin_users is 'Authorized users of the AMT Control Center.';
comment on table public.audit_logs is 'Security and operational audit events for the AMT Control Center.';
