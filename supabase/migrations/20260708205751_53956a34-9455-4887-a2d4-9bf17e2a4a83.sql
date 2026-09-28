
CREATE TABLE public.crm_canais_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal text NOT NULL,
  provedor text NOT NULL DEFAULT 'n8n_webhook',
  webhook_url text,
  headers_extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(canal, provedor)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_canais_config TO authenticated;
GRANT ALL ON public.crm_canais_config TO service_role;

ALTER TABLE public.crm_canais_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admins manage canais config"
  ON public.crm_canais_config FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_canais_config_updated
  BEFORE UPDATE ON public.crm_canais_config
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.crm_mensagens
  ADD COLUMN IF NOT EXISTS erro text,
  ADD COLUMN IF NOT EXISTS enviado_via text,
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE INDEX IF NOT EXISTS idx_crm_mensagens_pendentes
  ON public.crm_mensagens (status, created_at)
  WHERE status = 'pendente' AND direcao = 'saida';
