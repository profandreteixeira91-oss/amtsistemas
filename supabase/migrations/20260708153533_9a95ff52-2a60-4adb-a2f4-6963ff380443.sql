CREATE TABLE public.manager_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  provedor TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credenciais_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  ultimo_teste_em TIMESTAMPTZ,
  ultimo_erro TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_integracoes TO authenticated;
GRANT ALL ON public.manager_integracoes TO service_role;

ALTER TABLE public.manager_integracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins gerenciam integracoes"
  ON public.manager_integracoes FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_manager_integracoes_updated_at
  BEFORE UPDATE ON public.manager_integracoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_manager_integracoes_tipo ON public.manager_integracoes(tipo);
CREATE INDEX idx_manager_integracoes_ativo ON public.manager_integracoes(ativo);