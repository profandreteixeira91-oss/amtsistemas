
-- LEADS
CREATE TABLE public.manager_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  empresa text,
  email text,
  telefone text,
  cargo text,
  origem text,
  status text NOT NULL DEFAULT 'novo',
  score integer NOT NULL DEFAULT 0,
  sistema_interesse_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  observacoes text,
  proximo_contato date,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_leads TO authenticated;
GRANT ALL ON public.manager_leads TO service_role;
ALTER TABLE public.manager_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage leads" ON public.manager_leads FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.manager_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- OPORTUNIDADES
CREATE TABLE public.manager_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  plano_id uuid REFERENCES public.manager_planos(id) ON DELETE SET NULL,
  estagio text NOT NULL DEFAULT 'prospeccao',
  valor numeric(12,2) NOT NULL DEFAULT 0,
  probabilidade integer NOT NULL DEFAULT 0,
  previsao_fechamento date,
  motivo_perda text,
  fechada_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_oportunidades TO authenticated;
GRANT ALL ON public.manager_oportunidades TO service_role;
ALTER TABLE public.manager_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage oportunidades" ON public.manager_oportunidades FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_oportunidades_updated BEFORE UPDATE ON public.manager_oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ATIVIDADES
CREATE TABLE public.manager_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'nota',
  titulo text NOT NULL,
  descricao text,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE CASCADE,
  oportunidade_id uuid REFERENCES public.manager_oportunidades(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE CASCADE,
  agendada_para timestamptz,
  concluida boolean NOT NULL DEFAULT false,
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_atividades TO authenticated;
GRANT ALL ON public.manager_atividades TO service_role;
ALTER TABLE public.manager_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage atividades" ON public.manager_atividades FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_atividades_updated BEFORE UPDATE ON public.manager_atividades
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_leads_status ON public.manager_leads(status);
CREATE INDEX idx_oport_estagio ON public.manager_oportunidades(estagio);
CREATE INDEX idx_ativ_agendada ON public.manager_atividades(agendada_para) WHERE concluida = false;
