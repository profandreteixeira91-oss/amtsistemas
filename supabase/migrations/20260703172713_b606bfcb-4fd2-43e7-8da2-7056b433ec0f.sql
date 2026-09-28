
CREATE TABLE public.receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  rendimento text,
  tempo_preparo_min integer,
  utensilios jsonb NOT NULL DEFAULT '[]'::jsonb,
  modo_preparo text NOT NULL DEFAULT '',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (produto_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;
GRANT ALL ON public.receitas TO service_role;

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem receitas da empresa"
  ON public.receitas FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY "Admin e cozinha inserem receitas"
  ON public.receitas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_admin(auth.uid(), empresa_id)
    OR public.has_company_role(auth.uid(), empresa_id, 'cozinha')
  );

CREATE POLICY "Admin e cozinha atualizam receitas"
  ON public.receitas FOR UPDATE TO authenticated
  USING (
    public.is_company_admin(auth.uid(), empresa_id)
    OR public.has_company_role(auth.uid(), empresa_id, 'cozinha')
  )
  WITH CHECK (
    public.is_company_admin(auth.uid(), empresa_id)
    OR public.has_company_role(auth.uid(), empresa_id, 'cozinha')
  );

CREATE POLICY "Admin e cozinha removem receitas"
  ON public.receitas FOR DELETE TO authenticated
  USING (
    public.is_company_admin(auth.uid(), empresa_id)
    OR public.has_company_role(auth.uid(), empresa_id, 'cozinha')
  );

CREATE TRIGGER trg_receitas_updated_at
  BEFORE UPDATE ON public.receitas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
