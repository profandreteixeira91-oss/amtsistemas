
-- Leitura pública dos sistemas ativos (nome, slug, cor, url, descrição, logo)
CREATE POLICY "public le sistemas ativos"
  ON public.manager_sistemas
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

GRANT SELECT ON public.manager_sistemas TO anon;

-- Leitura pública dos planos ativos
CREATE POLICY "public le planos ativos"
  ON public.manager_planos
  FOR SELECT
  TO anon, authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM public.manager_sistemas s
      WHERE s.id = manager_planos.sistema_id AND s.ativo = true
    )
  );

GRANT SELECT ON public.manager_planos TO anon;
