
CREATE TABLE public.crm_integracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  nome text NOT NULL DEFAULT 'Principal',
  credenciais jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  ultimo_teste_em timestamptz,
  ultimo_teste_status text,
  ultimo_teste_mensagem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, nome)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_integracoes TO authenticated;
GRANT ALL ON public.crm_integracoes TO service_role;

ALTER TABLE public.crm_integracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admins manage integracoes"
  ON public.crm_integracoes FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_crm_integracoes_updated
  BEFORE UPDATE ON public.crm_integracoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
