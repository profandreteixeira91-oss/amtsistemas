
-- ============ PORTAL DO CLIENTE ============
CREATE TABLE public.crm_portal_acessos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID,
  proposta_id UUID,
  contrato_id UUID,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  last_access_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_portal_acessos TO authenticated;
GRANT ALL ON public.crm_portal_acessos TO service_role;
ALTER TABLE public.crm_portal_acessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all_portal_acessos" ON public.crm_portal_acessos
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_portal_token ON public.crm_portal_acessos(token);

-- ============ ASSINATURAS DIGITAIS ============
CREATE TABLE public.crm_assinaturas_digitais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  referencia_id UUID NOT NULL,
  signatario_nome TEXT NOT NULL,
  signatario_email TEXT NOT NULL,
  signatario_documento TEXT,
  documento_hash TEXT NOT NULL,
  assinatura_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  geolocalizacao JSONB,
  metodo TEXT NOT NULL DEFAULT 'click_wrap',
  assinado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidencias JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_assinaturas_digitais TO authenticated;
GRANT ALL ON public.crm_assinaturas_digitais TO service_role;
ALTER TABLE public.crm_assinaturas_digitais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all_assinaturas" ON public.crm_assinaturas_digitais
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_assinaturas_ref ON public.crm_assinaturas_digitais(tipo, referencia_id);

-- ============ FINANCEIRO AVANÇADO ============
CREATE TABLE public.crm_fin_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
  cor TEXT DEFAULT '#3B82F6',
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_fin_categorias TO authenticated;
GRANT ALL ON public.crm_fin_categorias TO service_role;
ALTER TABLE public.crm_fin_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all_fin_cat" ON public.crm_fin_categorias
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.crm_fin_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'banco',
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  saldo_inicial NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_atual NUMERIC(14,2) NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_fin_contas TO authenticated;
GRANT ALL ON public.crm_fin_contas TO service_role;
ALTER TABLE public.crm_fin_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all_fin_contas" ON public.crm_fin_contas
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.crm_fin_lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  categoria_id UUID REFERENCES public.crm_fin_categorias(id) ON DELETE SET NULL,
  conta_id UUID REFERENCES public.crm_fin_contas(id) ON DELETE SET NULL,
  cliente_id UUID,
  fornecedor TEXT,
  vencimento DATE NOT NULL,
  pago_em DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  forma_pagamento TEXT,
  documento TEXT,
  observacoes TEXT,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  recorrencia_config JSONB,
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_fin_lancamentos TO authenticated;
GRANT ALL ON public.crm_fin_lancamentos TO service_role;
ALTER TABLE public.crm_fin_lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all_fin_lanc" ON public.crm_fin_lancamentos
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_fin_lanc_venc ON public.crm_fin_lancamentos(vencimento, status);

CREATE TABLE public.crm_fin_conciliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_id UUID NOT NULL REFERENCES public.crm_fin_contas(id) ON DELETE CASCADE,
  lancamento_id UUID REFERENCES public.crm_fin_lancamentos(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  tipo TEXT NOT NULL,
  conciliado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_fin_conciliacoes TO authenticated;
GRANT ALL ON public.crm_fin_conciliacoes TO service_role;
ALTER TABLE public.crm_fin_conciliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all_fin_conc" ON public.crm_fin_conciliacoes
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ PWA PUSH ============
CREATE TABLE public.crm_push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_push_subscriptions TO authenticated;
GRANT ALL ON public.crm_push_subscriptions TO service_role;
ALTER TABLE public.crm_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_push" ON public.crm_push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGERS updated_at ============
CREATE TRIGGER trg_portal_upd BEFORE UPDATE ON public.crm_portal_acessos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_fincat_upd BEFORE UPDATE ON public.crm_fin_categorias FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_fincontas_upd BEFORE UPDATE ON public.crm_fin_contas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_finlanc_upd BEFORE UPDATE ON public.crm_fin_lancamentos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_finconc_upd BEFORE UPDATE ON public.crm_fin_conciliacoes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_push_upd BEFORE UPDATE ON public.crm_push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
