-- AMT Master Admin — infra base

-- 1) Segurança / auditoria
CREATE TABLE public.amt_admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  ip text,
  user_agent text,
  sucesso boolean NOT NULL DEFAULT false,
  motivo text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.amt_admin_login_attempts (email, criado_em DESC);
CREATE INDEX ON public.amt_admin_login_attempts (ip, criado_em DESC);
GRANT ALL ON public.amt_admin_login_attempts TO service_role;
GRANT SELECT ON public.amt_admin_login_attempts TO authenticated;
ALTER TABLE public.amt_admin_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins veem tentativas" ON public.amt_admin_login_attempts
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE TABLE public.amt_admin_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip text,
  user_agent text,
  geo_aprox text,
  rota text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.amt_admin_access_logs (user_id, criado_em DESC);
GRANT SELECT, INSERT ON public.amt_admin_access_logs TO authenticated;
GRANT ALL ON public.amt_admin_access_logs TO service_role;
ALTER TABLE public.amt_admin_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins leem access logs" ON public.amt_admin_access_logs
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super admins inserem access logs" ON public.amt_admin_access_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.amt_admin_mfa (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret text NOT NULL,
  ativado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amt_admin_mfa TO authenticated;
GRANT ALL ON public.amt_admin_mfa TO service_role;
ALTER TABLE public.amt_admin_mfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario gerencia proprio mfa" ON public.amt_admin_mfa
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_super_admin(auth.uid()));

CREATE TABLE public.amt_admin_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id text,
  antes jsonb,
  depois jsonb,
  ip text,
  user_agent text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.amt_admin_auditoria (entidade, entidade_id, criado_em DESC);
CREATE INDEX ON public.amt_admin_auditoria (user_id, criado_em DESC);
GRANT SELECT, INSERT ON public.amt_admin_auditoria TO authenticated;
GRANT ALL ON public.amt_admin_auditoria TO service_role;
ALTER TABLE public.amt_admin_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins leem auditoria" ON public.amt_admin_auditoria
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super admins inserem auditoria" ON public.amt_admin_auditoria
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

-- 2) Extensões em manager_sistemas / manager_planos
ALTER TABLE public.manager_sistemas
  ADD COLUMN IF NOT EXISTS versao text,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS cores jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dominio text,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS trial_dias integer DEFAULT 14;

ALTER TABLE public.manager_planos
  ADD COLUMN IF NOT EXISTS cor text,
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS recomendado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS texto_comercial text,
  ADD COLUMN IF NOT EXISTS botao_destaque text,
  ADD COLUMN IF NOT EXISTS limites jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) Módulos dinâmicos
CREATE TABLE public.amt_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  categoria text,
  icone text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.amt_modulos TO authenticated;
GRANT ALL ON public.amt_modulos TO service_role;
ALTER TABLE public.amt_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura autenticada modulos" ON public.amt_modulos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "super admin gerencia modulos" ON public.amt_modulos
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.amt_sistema_modulos (
  sistema_id uuid NOT NULL REFERENCES public.manager_sistemas(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES public.amt_modulos(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sistema_id, modulo_id)
);
GRANT SELECT ON public.amt_sistema_modulos TO authenticated;
GRANT ALL ON public.amt_sistema_modulos TO service_role;
ALTER TABLE public.amt_sistema_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura autenticada sistema_modulos" ON public.amt_sistema_modulos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "super admin gerencia sistema_modulos" ON public.amt_sistema_modulos
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.amt_plano_modulos (
  plano_id uuid NOT NULL REFERENCES public.manager_planos(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES public.amt_modulos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'liberado' CHECK (status IN ('liberado','bloqueado')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plano_id, modulo_id)
);
GRANT SELECT ON public.amt_plano_modulos TO authenticated;
GRANT ALL ON public.amt_plano_modulos TO service_role;
ALTER TABLE public.amt_plano_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura autenticada plano_modulos" ON public.amt_plano_modulos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "super admin gerencia plano_modulos" ON public.amt_plano_modulos
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.amt_assinatura_overrides (
  assinatura_id uuid NOT NULL REFERENCES public.manager_assinaturas(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES public.amt_modulos(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('liberado','bloqueado')),
  motivo text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assinatura_id, modulo_id)
);
GRANT SELECT ON public.amt_assinatura_overrides TO authenticated;
GRANT ALL ON public.amt_assinatura_overrides TO service_role;
ALTER TABLE public.amt_assinatura_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia overrides" ON public.amt_assinatura_overrides
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 4) Asaas — fila e log
CREATE TABLE public.amt_asaas_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  payload jsonb NOT NULL,
  assinatura_id uuid REFERENCES public.manager_assinaturas(id) ON DELETE SET NULL,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','processando','ok','falha')),
  tentativas int NOT NULL DEFAULT 0,
  proximo_em timestamptz NOT NULL DEFAULT now(),
  ultimo_erro text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.amt_asaas_fila (status, proximo_em);
GRANT SELECT ON public.amt_asaas_fila TO authenticated;
GRANT ALL ON public.amt_asaas_fila TO service_role;
ALTER TABLE public.amt_asaas_fila ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin le fila asaas" ON public.amt_asaas_fila
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

ALTER TABLE public.manager_assinaturas
  ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS sync_ultimo_em timestamptz,
  ADD COLUMN IF NOT EXISTS sync_erro text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

-- 5) Rate limit
CREATE OR REPLACE FUNCTION public.amt_admin_check_rate_limit(_email text, _ip text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT COUNT(*) FROM public.amt_admin_login_attempts
    WHERE sucesso = false
      AND criado_em > now() - interval '15 minutes'
      AND (email = _email OR ip = _ip)
  ) < 5, true);
$$;
