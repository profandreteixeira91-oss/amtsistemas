
CREATE TABLE public.manager_campanhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  canal text NOT NULL DEFAULT 'email',
  tipo text NOT NULL DEFAULT 'promocional',
  status text NOT NULL DEFAULT 'rascunho',
  assunto text,
  conteudo text,
  cta_texto text,
  cta_url text,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  segmento_id uuid,
  agendada_para timestamptz,
  enviada_em timestamptz,
  total_destinatarios integer NOT NULL DEFAULT 0,
  total_enviados integer NOT NULL DEFAULT 0,
  total_abertos integer NOT NULL DEFAULT 0,
  total_cliques integer NOT NULL DEFAULT 0,
  total_conversoes integer NOT NULL DEFAULT 0,
  custo numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_campanhas TO authenticated;
GRANT ALL ON public.manager_campanhas TO service_role;
ALTER TABLE public.manager_campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage campanhas" ON public.manager_campanhas FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_campanhas_updated BEFORE UPDATE ON public.manager_campanhas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_segmentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'clientes',
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_contatos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_segmentos TO authenticated;
GRANT ALL ON public.manager_segmentos TO service_role;
ALTER TABLE public.manager_segmentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage segmentos" ON public.manager_segmentos FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_segmentos_updated BEFORE UPDATE ON public.manager_segmentos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_campanhas_status ON public.manager_campanhas(status);
CREATE INDEX idx_campanhas_canal ON public.manager_campanhas(canal);
