
CREATE SEQUENCE IF NOT EXISTS public.cupons_fiscais_numero_seq;

CREATE TABLE public.cupons_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  comanda_id uuid REFERENCES public.comandas(id) ON DELETE SET NULL,
  numero bigint NOT NULL DEFAULT nextval('public.cupons_fiscais_numero_seq'),
  emitido_em timestamptz NOT NULL DEFAULT now(),
  emitido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text,
  endereco text,
  cidade text,
  estado text,
  telefone text,
  mesa_numero integer,
  cliente_nome text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  desconto numeric(12,2) NOT NULL DEFAULT 0,
  taxa_servico numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  pagamentos jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons_fiscais TO authenticated;
GRANT ALL ON public.cupons_fiscais TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.cupons_fiscais_numero_seq TO authenticated;

ALTER TABLE public.cupons_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cupom_select_membro" ON public.cupons_fiscais FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY "cupom_insert_membro" ON public.cupons_fiscais FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY "cupom_delete_admin" ON public.cupons_fiscais FOR DELETE TO authenticated
  USING (
    public.has_company_role(auth.uid(), empresa_id, 'admin'::app_role)
    OR public.has_company_role(auth.uid(), empresa_id, 'gerencia'::app_role)
  );

CREATE INDEX cupons_fiscais_empresa_idx ON public.cupons_fiscais(empresa_id, emitido_em DESC);
CREATE INDEX cupons_fiscais_comanda_idx ON public.cupons_fiscais(comanda_id);
