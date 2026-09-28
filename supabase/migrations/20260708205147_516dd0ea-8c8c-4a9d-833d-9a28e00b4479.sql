CREATE TABLE public.crm_sequencia_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequencia_id uuid NOT NULL REFERENCES public.crm_sequencias(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE CASCADE,
  passo_atual integer NOT NULL DEFAULT 0,
  proximo_disparo_em timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ativa',
  ultima_execucao_em timestamp with time zone,
  mensagens_geradas integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT crm_seq_enroll_target_chk CHECK (lead_id IS NOT NULL OR cliente_id IS NOT NULL)
);

CREATE INDEX crm_seq_enroll_due_idx ON public.crm_sequencia_enrollments (status, proximo_disparo_em);
CREATE INDEX crm_seq_enroll_lead_idx ON public.crm_sequencia_enrollments (lead_id);
CREATE UNIQUE INDEX crm_seq_enroll_lead_unique ON public.crm_sequencia_enrollments (sequencia_id, lead_id) WHERE lead_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_sequencia_enrollments TO authenticated;
GRANT ALL ON public.crm_sequencia_enrollments TO service_role;

ALTER TABLE public.crm_sequencia_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin manage seq enrollments"
  ON public.crm_sequencia_enrollments
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_crm_seq_enroll_updated
  BEFORE UPDATE ON public.crm_sequencia_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();