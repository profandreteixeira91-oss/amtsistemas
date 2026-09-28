
CREATE TABLE public.crm_lembretes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'consulta',
  titulo text,
  destinatario_nome text,
  destinatario_telefone text NOT NULL,
  lead_id uuid,
  cliente_id uuid,
  template text NOT NULL,
  variaveis jsonb NOT NULL DEFAULT '{}'::jsonb,
  agendado_para timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  mensagem_id uuid,
  tentativas int NOT NULL DEFAULT 0,
  erro text,
  observacoes text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX crm_lembretes_status_agendado_idx
  ON public.crm_lembretes (status, agendado_para);
CREATE INDEX crm_lembretes_lead_idx ON public.crm_lembretes (lead_id);
CREATE INDEX crm_lembretes_cliente_idx ON public.crm_lembretes (cliente_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_lembretes TO authenticated;
GRANT ALL ON public.crm_lembretes TO service_role;

ALTER TABLE public.crm_lembretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admins manage lembretes"
  ON public.crm_lembretes
  FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_crm_lembretes_updated
  BEFORE UPDATE ON public.crm_lembretes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
