
-- Fase 6: Inteligência Comercial
ALTER TABLE public.manager_leads
  ADD COLUMN IF NOT EXISTS score_motivo text,
  ADD COLUMN IF NOT EXISTS score_atualizado_em timestamptz;

ALTER TABLE public.crm_mensagens
  ADD COLUMN IF NOT EXISTS sentimento text,
  ADD COLUMN IF NOT EXISTS intencao text,
  ADD COLUMN IF NOT EXISTS urgencia text,
  ADD COLUMN IF NOT EXISTS analise_ia jsonb;

CREATE TABLE IF NOT EXISTS public.crm_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  severidade text NOT NULL DEFAULT 'info',
  titulo text NOT NULL,
  mensagem text,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE CASCADE,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  lido boolean NOT NULL DEFAULT false,
  lido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_alertas TO authenticated;
GRANT ALL ON public.crm_alertas TO service_role;

ALTER TABLE public.crm_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admins manage crm_alertas"
  ON public.crm_alertas FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_alertas_lido ON public.crm_alertas(lido, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_alertas_lead ON public.crm_alertas(lead_id);
CREATE INDEX IF NOT EXISTS idx_manager_leads_score ON public.manager_leads(score DESC NULLS LAST);
