CREATE TABLE public.manager_scraper_buscas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema_id UUID REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  tipo_negocio TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  rede TEXT NOT NULL DEFAULT 'google',
  termo_extra TEXT,
  query_final TEXT NOT NULL,
  total_resultados INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  erro TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.manager_scraper_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  busca_id UUID NOT NULL REFERENCES public.manager_scraper_buscas(id) ON DELETE CASCADE,
  nome TEXT,
  titulo TEXT,
  url TEXT NOT NULL,
  dominio TEXT,
  snippet TEXT,
  telefone TEXT,
  email TEXT,
  rede TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  importado BOOLEAN NOT NULL DEFAULT false,
  lead_id UUID REFERENCES public.manager_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_scraper_buscas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_scraper_resultados TO authenticated;
GRANT ALL ON public.manager_scraper_buscas TO service_role;
GRANT ALL ON public.manager_scraper_resultados TO service_role;

ALTER TABLE public.manager_scraper_buscas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_scraper_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins gerenciam scraper buscas"
  ON public.manager_scraper_buscas FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins gerenciam scraper resultados"
  ON public.manager_scraper_resultados FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_manager_scraper_buscas_updated
  BEFORE UPDATE ON public.manager_scraper_buscas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_scraper_buscas_created ON public.manager_scraper_buscas(created_at DESC);
CREATE INDEX idx_scraper_resultados_busca ON public.manager_scraper_resultados(busca_id);
CREATE INDEX idx_scraper_resultados_importado ON public.manager_scraper_resultados(importado);