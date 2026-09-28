
CREATE TABLE public.amt_page_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema_id UUID NOT NULL REFERENCES public.manager_sistemas(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL DEFAULT '/',
  selector TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'texto',
  texto_original TEXT,
  texto_novo TEXT,
  attr TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sistema_id, page_path, selector, attr)
);

GRANT SELECT ON public.amt_page_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amt_page_overrides TO authenticated;
GRANT ALL ON public.amt_page_overrides TO service_role;

ALTER TABLE public.amt_page_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active overrides"
  ON public.amt_page_overrides FOR SELECT TO anon
  USING (ativo = true);

CREATE POLICY "Auth read overrides"
  ON public.amt_page_overrides FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin manage overrides"
  ON public.amt_page_overrides FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX idx_amt_page_overrides_lookup
  ON public.amt_page_overrides (sistema_id, page_path)
  WHERE ativo = true;

CREATE TRIGGER trg_amt_page_overrides_updated
  BEFORE UPDATE ON public.amt_page_overrides
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
