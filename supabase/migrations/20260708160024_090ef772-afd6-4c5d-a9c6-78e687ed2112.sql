
CREATE TABLE public.manager_configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  chave text NOT NULL UNIQUE,
  valor jsonb NOT NULL DEFAULT '{}'::jsonb,
  descricao text,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_configuracoes TO authenticated;
GRANT ALL ON public.manager_configuracoes TO service_role;

ALTER TABLE public.manager_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_super_admin_all"
ON public.manager_configuracoes FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER manager_configuracoes_set_updated_at
BEFORE UPDATE ON public.manager_configuracoes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX manager_configuracoes_categoria_idx ON public.manager_configuracoes (categoria);
