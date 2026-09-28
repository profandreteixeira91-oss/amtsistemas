
CREATE TABLE public.manager_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  headline TEXT,
  subheadline TEXT,
  cta_texto TEXT,
  cta_url TEXT,
  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,
  cor_primaria TEXT DEFAULT '#6366f1',
  imagem_hero TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicada','arquivada')),
  campanha_id UUID REFERENCES public.manager_campanhas(id) ON DELETE SET NULL,
  sistema_id UUID REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  conversoes INTEGER NOT NULL DEFAULT 0,
  seo_titulo TEXT,
  seo_descricao TEXT,
  publicada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_landing_pages TO authenticated;
GRANT SELECT ON public.manager_landing_pages TO anon;
GRANT ALL ON public.manager_landing_pages TO service_role;

ALTER TABLE public.manager_landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage landing pages"
  ON public.manager_landing_pages FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Public can read published landing pages"
  ON public.manager_landing_pages FOR SELECT TO anon
  USING (status = 'publicada');

CREATE POLICY "Auth can read published landing pages"
  ON public.manager_landing_pages FOR SELECT TO authenticated
  USING (status = 'publicada' OR public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_manager_landing_pages_updated
  BEFORE UPDATE ON public.manager_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_landing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.manager_landing_pages(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  mensagem TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_landing_leads TO authenticated;
GRANT INSERT ON public.manager_landing_leads TO anon;
GRANT ALL ON public.manager_landing_leads TO service_role;

ALTER TABLE public.manager_landing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage landing leads"
  ON public.manager_landing_leads FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Anyone can submit landing leads"
  ON public.manager_landing_leads FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.manager_landing_pages lp
            WHERE lp.id = landing_page_id AND lp.status = 'publicada')
  );

CREATE POLICY "Auth can submit landing leads"
  ON public.manager_landing_leads FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.manager_landing_pages lp
            WHERE lp.id = landing_page_id AND lp.status = 'publicada')
  );

CREATE INDEX idx_manager_landing_leads_page ON public.manager_landing_leads(landing_page_id);
CREATE INDEX idx_manager_landing_pages_slug ON public.manager_landing_pages(slug);
