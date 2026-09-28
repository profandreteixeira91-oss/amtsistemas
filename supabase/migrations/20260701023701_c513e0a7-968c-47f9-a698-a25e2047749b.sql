
CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  cpf text NOT NULL,
  telefone text NOT NULL,
  endereco text NOT NULL,
  email text NOT NULL,
  funcao public.app_role NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, cpf),
  UNIQUE(empresa_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da empresa podem ver colaboradores"
  ON public.colaboradores FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY "Admins da empresa podem inserir colaboradores"
  ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(auth.uid(), empresa_id));

CREATE POLICY "Admins da empresa podem atualizar colaboradores"
  ON public.colaboradores FOR UPDATE TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_admin(auth.uid(), empresa_id));

CREATE POLICY "Admins da empresa podem remover colaboradores"
  ON public.colaboradores FOR DELETE TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id));

CREATE TRIGGER tg_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
