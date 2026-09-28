
-- ============ FORNECEDORES ============
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  contato_nome text,
  email text,
  telefone text,
  whatsapp text,
  endereco text,
  categorias text[] DEFAULT '{}',
  condicoes_pagamento text,
  prazo_entrega_dias integer,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fornecedores_empresa ON public.fornecedores(empresa_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedor_all_membro" ON public.fornecedores FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));
CREATE TRIGGER trg_upd_fornecedores BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ LISTAS DE PREÇO ============
CREATE TABLE public.listas_preco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_vigencia date NOT NULL DEFAULT CURRENT_DATE,
  arquivo_nome text,
  ativo boolean NOT NULL DEFAULT true,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_listas_preco_empresa ON public.listas_preco(empresa_id);
CREATE INDEX idx_listas_preco_fornecedor ON public.listas_preco(fornecedor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listas_preco TO authenticated;
GRANT ALL ON public.listas_preco TO service_role;
ALTER TABLE public.listas_preco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lista_preco_all_membro" ON public.listas_preco FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));
CREATE TRIGGER trg_upd_listas_preco BEFORE UPDATE ON public.listas_preco
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ ITENS DA LISTA DE PREÇO ============
CREATE TABLE public.itens_lista_preco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  lista_id uuid NOT NULL REFERENCES public.listas_preco(id) ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  insumo_id uuid REFERENCES public.insumos(id) ON DELETE SET NULL,
  nome_produto text NOT NULL,
  nome_normalizado text GENERATED ALWAYS AS (lower(trim(nome_produto))) STORED,
  unidade text NOT NULL DEFAULT 'un',
  preco numeric(12,4) NOT NULL,
  quantidade_minima numeric(12,3) DEFAULT 1,
  prazo_entrega_dias integer,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_itens_lista_empresa ON public.itens_lista_preco(empresa_id);
CREATE INDEX idx_itens_lista_lista ON public.itens_lista_preco(lista_id);
CREATE INDEX idx_itens_lista_fornecedor ON public.itens_lista_preco(fornecedor_id);
CREATE INDEX idx_itens_lista_normalizado ON public.itens_lista_preco(empresa_id, nome_normalizado);
CREATE INDEX idx_itens_lista_insumo ON public.itens_lista_preco(insumo_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_lista_preco TO authenticated;
GRANT ALL ON public.itens_lista_preco TO service_role;
ALTER TABLE public.itens_lista_preco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_lista_all_membro" ON public.itens_lista_preco FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- ============ PEDIDOS DE COMPRA ============
CREATE TYPE public.status_pedido_compra AS ENUM ('rascunho','enviado','confirmado','recebido','cancelado');

CREATE TABLE public.pedidos_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
  numero serial NOT NULL,
  status status_pedido_compra NOT NULL DEFAULT 'rascunho',
  total numeric(12,2) NOT NULL DEFAULT 0,
  email_destinatario text,
  assunto text,
  corpo_email text,
  enviado_em timestamptz,
  entrega_prevista date,
  observacao text,
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_compra_empresa ON public.pedidos_compra(empresa_id);
CREATE INDEX idx_pedidos_compra_fornecedor ON public.pedidos_compra(fornecedor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_compra TO authenticated;
GRANT ALL ON public.pedidos_compra TO service_role;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pedido_compra_all_membro" ON public.pedidos_compra FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));
CREATE TRIGGER trg_upd_pedidos_compra BEFORE UPDATE ON public.pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ ITENS DO PEDIDO ============
CREATE TABLE public.itens_pedido_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  pedido_id uuid NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
  insumo_id uuid REFERENCES public.insumos(id) ON DELETE SET NULL,
  nome_produto text NOT NULL,
  unidade text NOT NULL DEFAULT 'un',
  quantidade numeric(12,3) NOT NULL,
  preco_unitario numeric(12,4) NOT NULL,
  total numeric(12,2) GENERATED ALWAYS AS (round(quantidade * preco_unitario, 2)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_itens_pedido_empresa ON public.itens_pedido_compra(empresa_id);
CREATE INDEX idx_itens_pedido_pedido ON public.itens_pedido_compra(pedido_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_pedido_compra TO authenticated;
GRANT ALL ON public.itens_pedido_compra TO service_role;
ALTER TABLE public.itens_pedido_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item_pedido_all_membro" ON public.itens_pedido_compra FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- ============ RECALCULA TOTAL DO PEDIDO ============
CREATE OR REPLACE FUNCTION public.tg_recalc_pedido_compra()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_total numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(total),0) INTO v_total
  FROM public.itens_pedido_compra
  WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  UPDATE public.pedidos_compra SET total = v_total, updated_at = now()
  WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_recalc_pedido AFTER INSERT OR UPDATE OR DELETE ON public.itens_pedido_compra
  FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_pedido_compra();
