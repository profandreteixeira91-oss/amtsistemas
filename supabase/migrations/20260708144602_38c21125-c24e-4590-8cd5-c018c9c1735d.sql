
-- Núcleo comercial do Manager
CREATE TABLE public.manager_sistemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  url TEXT,
  logo_url TEXT,
  cor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_sistemas TO authenticated;
GRANT ALL ON public.manager_sistemas TO service_role;
ALTER TABLE public.manager_sistemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia sistemas" ON public.manager_sistemas
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_manager_sistemas_updated BEFORE UPDATE ON public.manager_sistemas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_planos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sistema_id UUID NOT NULL REFERENCES public.manager_sistemas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_anual NUMERIC(12,2) NOT NULL DEFAULT 0,
  recursos JSONB NOT NULL DEFAULT '[]'::jsonb,
  limites JSONB NOT NULL DEFAULT '{}'::jsonb,
  ordem INT NOT NULL DEFAULT 0,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sistema_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_planos TO authenticated;
GRANT ALL ON public.manager_planos TO service_role;
ALTER TABLE public.manager_planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia planos" ON public.manager_planos
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_manager_planos_updated BEFORE UPDATE ON public.manager_planos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  documento TEXT,
  tipo_documento TEXT NOT NULL DEFAULT 'cnpj',
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  responsavel_nome TEXT,
  responsavel_email TEXT,
  responsavel_telefone TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_clientes TO authenticated;
GRANT ALL ON public.manager_clientes TO service_role;
ALTER TABLE public.manager_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia clientes" ON public.manager_clientes
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_manager_clientes_updated BEFORE UPDATE ON public.manager_clientes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.manager_clientes(id) ON DELETE CASCADE,
  sistema_id UUID NOT NULL REFERENCES public.manager_sistemas(id) ON DELETE RESTRICT,
  plano_id UUID NOT NULL REFERENCES public.manager_planos(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trial',
  ciclo TEXT NOT NULL DEFAULT 'mensal',
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  inicio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ate TIMESTAMPTZ,
  proxima_cobranca TIMESTAMPTZ,
  cancelada_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  external_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_assinaturas TO authenticated;
GRANT ALL ON public.manager_assinaturas TO service_role;
ALTER TABLE public.manager_assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia assinaturas" ON public.manager_assinaturas
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_manager_assinaturas_updated BEFORE UPDATE ON public.manager_assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_manager_planos_sistema ON public.manager_planos(sistema_id);
CREATE INDEX idx_manager_assinaturas_cliente ON public.manager_assinaturas(cliente_id);
CREATE INDEX idx_manager_assinaturas_sistema ON public.manager_assinaturas(sistema_id);
CREATE INDEX idx_manager_assinaturas_status ON public.manager_assinaturas(status);

-- Seed: AMT Restaurant como sistema inicial
INSERT INTO public.manager_sistemas (nome, slug, descricao, url, cor)
VALUES ('AMT Restaurant', 'amt-restaurant', 'ERP completo para bares e restaurantes', 'https://restaurant.amtsistemas.com.br', '#f97316')
ON CONFLICT (slug) DO NOTHING;
