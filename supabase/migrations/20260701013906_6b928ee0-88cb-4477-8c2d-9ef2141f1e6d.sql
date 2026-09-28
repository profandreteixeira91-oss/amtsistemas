
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'gerencia', 'garcom', 'caixa', 'cozinha');

-- ============ EMPRESAS ============
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  fuso_horario TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  logo_url TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- ============ PERFIS ============
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  avatar_url TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- ============ MEMBROS (user <-> empresa <-> role) ============
CREATE TABLE public.membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, empresa_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membros TO authenticated;
GRANT ALL ON public.membros TO service_role;
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_membros_user ON public.membros(user_id);
CREATE INDEX idx_membros_empresa ON public.membros(empresa_id);

-- ============ FUNÇÕES DE AUTORIZAÇÃO (SECURITY DEFINER) ============
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _empresa_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros
    WHERE user_id = _user_id AND empresa_id = _empresa_id AND role = _role AND ativo = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _empresa_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros
    WHERE user_id = _user_id AND empresa_id = _empresa_id AND ativo = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _empresa_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros
    WHERE user_id = _user_id AND empresa_id = _empresa_id AND role = 'admin' AND ativo = true
  )
$$;

-- ============ POLICIES ============

-- perfis: cada usuário vê/edita apenas o próprio
CREATE POLICY "perfil_select_self" ON public.perfis FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "perfil_update_self" ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "perfil_insert_self" ON public.perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- empresas: usuário vê empresas em que é membro; qualquer autenticado pode criar (vira admin via trigger); admin da empresa pode atualizar/excluir
CREATE POLICY "empresa_select_membro" ON public.empresas FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id));
CREATE POLICY "empresa_insert_auth" ON public.empresas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = criada_por);
CREATE POLICY "empresa_update_admin" ON public.empresas FOR UPDATE TO authenticated
  USING (public.is_company_admin(auth.uid(), id)) WITH CHECK (public.is_company_admin(auth.uid(), id));
CREATE POLICY "empresa_delete_admin" ON public.empresas FOR DELETE TO authenticated
  USING (public.is_company_admin(auth.uid(), id));

-- membros: usuário vê próprios memberships + admins veem todos da empresa; admins gerenciam
CREATE POLICY "membro_select_self_or_admin" ON public.membros FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_admin(auth.uid(), empresa_id));
CREATE POLICY "membro_insert_admin" ON public.membros FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(auth.uid(), empresa_id));
CREATE POLICY "membro_update_admin" ON public.membros FOR UPDATE TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id)) WITH CHECK (public.is_company_admin(auth.uid(), empresa_id));
CREATE POLICY "membro_delete_admin" ON public.membros FOR DELETE TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id));

-- ============ AUDITORIA ============
CREATE TABLE public.auditoria (
  id BIGSERIAL PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT,
  entidade_id TEXT,
  detalhes JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT USAGE ON SEQUENCE public.auditoria_id_seq TO authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditoria_select_admin" ON public.auditoria FOR SELECT TO authenticated
  USING (empresa_id IS NULL AND user_id = auth.uid() OR public.is_company_admin(auth.uid(), empresa_id));
CREATE POLICY "auditoria_insert_membro" ON public.auditoria FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (empresa_id IS NULL OR public.is_company_member(auth.uid(), empresa_id)));

-- ============ TRIGGERS ============
-- updated_at genérico
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_empresas_updated BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_perfis_updated BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- cria perfil ao criar usuário no auth
CREATE OR REPLACE FUNCTION public.tg_novo_usuario() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tg_novo_usuario();

-- quando uma empresa é criada, adiciona o criador como admin
CREATE OR REPLACE FUNCTION public.tg_empresa_criada() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.criada_por IS NOT NULL THEN
    INSERT INTO public.membros (user_id, empresa_id, role)
    VALUES (NEW.criada_por, NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_empresa_criada AFTER INSERT ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.tg_empresa_criada();
