
CREATE TYPE public.status_caixa AS ENUM ('aberta','fechada');

CREATE TABLE public.caixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  aberto_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aberta_em timestamptz NOT NULL DEFAULT now(),
  valor_abertura numeric(12,2) NOT NULL DEFAULT 0,
  fechado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fechada_em timestamptz,
  valor_fechamento numeric(12,2),
  observacoes text,
  status public.status_caixa NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX caixas_empresa_status_idx ON public.caixas (empresa_id, status);
CREATE UNIQUE INDEX caixas_uma_aberta_por_empresa
  ON public.caixas (empresa_id)
  WHERE status = 'aberta';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.caixas TO authenticated;
GRANT ALL ON public.caixas TO service_role;

ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY caixa_select_membro ON public.caixas
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY caixa_insert_membro ON public.caixas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY caixa_update_membro ON public.caixas
  FOR UPDATE TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY caixa_delete_admin ON public.caixas
  FOR DELETE TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id));

CREATE TRIGGER trg_caixas_updated_at
  BEFORE UPDATE ON public.caixas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Vincular pagamentos à sessão de caixa
ALTER TABLE public.pagamentos
  ADD COLUMN caixa_id uuid REFERENCES public.caixas(id) ON DELETE SET NULL;

CREATE INDEX pagamentos_caixa_id_idx ON public.pagamentos (caixa_id);
