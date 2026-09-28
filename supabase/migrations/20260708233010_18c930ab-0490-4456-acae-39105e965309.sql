
-- 1) Tabela de configuração (singleton lógico)
CREATE TABLE IF NOT EXISTS public.manager_scraper_auto_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ativo BOOLEAN NOT NULL DEFAULT false,
  sistemas_ids UUID[] NOT NULL DEFAULT '{}',
  ufs TEXT[] NOT NULL DEFAULT '{}',
  score_min INTEGER NOT NULL DEFAULT 3,
  enriquecer BOOLEAN NOT NULL DEFAULT true,
  limite_por_busca INTEGER NOT NULL DEFAULT 15,
  ultimo_uf TEXT,
  ultimo_sistema_id UUID,
  ultima_execucao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_scraper_auto_config TO authenticated;
GRANT ALL ON public.manager_scraper_auto_config TO service_role;

ALTER TABLE public.manager_scraper_auto_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins gerenciam auto_config"
  ON public.manager_scraper_auto_config;
CREATE POLICY "super admins gerenciam auto_config"
  ON public.manager_scraper_auto_config
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_scraper_auto_config_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scraper_auto_config_updated ON public.manager_scraper_auto_config;
CREATE TRIGGER trg_scraper_auto_config_updated
BEFORE UPDATE ON public.manager_scraper_auto_config
FOR EACH ROW EXECUTE FUNCTION public.tg_scraper_auto_config_updated();

-- 2) Marcar buscas do robô
ALTER TABLE public.manager_scraper_buscas
  ADD COLUMN IF NOT EXISTS automatica BOOLEAN NOT NULL DEFAULT false;

-- 3) Extensões necessárias para o agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
