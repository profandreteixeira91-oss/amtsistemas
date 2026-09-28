
-- =========================================================
-- KitchenOS — Módulos Operacionais (Sprint 2 e 3 unificados)
-- Cardápio, Ficha Técnica, Estoque, Mesas, Comandas, KDS, Financeiro
-- =========================================================

-- Enums
CREATE TYPE public.unidade_medida AS ENUM ('un','kg','g','l','ml','dz','cx','pct');
CREATE TYPE public.status_mesa AS ENUM ('livre','ocupada','reservada','manutencao');
CREATE TYPE public.status_comanda AS ENUM ('aberta','fechada','cancelada','em_pagamento');
CREATE TYPE public.status_item AS ENUM ('pendente','preparando','pronto','entregue','cancelado');
CREATE TYPE public.tipo_movimento AS ENUM ('entrada','saida','ajuste','perda','transferencia');
CREATE TYPE public.metodo_pagamento AS ENUM ('dinheiro','debito','credito','pix','vale','outros');
CREATE TYPE public.tipo_lancamento AS ENUM ('receita','despesa');

-- =========================================================
-- CARDÁPIO
-- =========================================================
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ordem int NOT NULL DEFAULT 0,
  ativa boolean NOT NULL DEFAULT true,
  cor text,
  icone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY categoria_all_membro ON public.categorias FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  codigo text,
  preco_venda numeric(12,2) NOT NULL DEFAULT 0,
  custo numeric(12,2) NOT NULL DEFAULT 0,
  cmv_percentual numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN preco_venda > 0 THEN (custo / preco_venda) * 100 ELSE 0 END
  ) STORED,
  tempo_preparo_min int DEFAULT 0,
  imagem_url text,
  disponivel boolean NOT NULL DEFAULT true,
  destaque boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY produto_all_membro ON public.produtos FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- ESTOQUE / INSUMOS
-- =========================================================
CREATE TABLE public.insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  unidade public.unidade_medida NOT NULL DEFAULT 'un',
  custo_unitario numeric(12,4) NOT NULL DEFAULT 0,
  estoque_atual numeric(12,3) NOT NULL DEFAULT 0,
  estoque_minimo numeric(12,3) NOT NULL DEFAULT 0,
  fornecedor text,
  categoria text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
GRANT ALL ON public.insumos TO service_role;
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY insumo_all_membro ON public.insumos FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

CREATE TABLE public.movimentos_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  tipo public.tipo_movimento NOT NULL,
  quantidade numeric(12,3) NOT NULL,
  custo_unitario numeric(12,4),
  motivo text,
  referencia text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentos_estoque TO authenticated;
GRANT ALL ON public.movimentos_estoque TO service_role;
ALTER TABLE public.movimentos_estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY movimento_all_membro ON public.movimentos_estoque FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- FICHA TÉCNICA
-- =========================================================
CREATE TABLE public.ficha_tecnica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES public.insumos(id) ON DELETE RESTRICT,
  quantidade numeric(12,3) NOT NULL,
  unidade public.unidade_medida NOT NULL,
  perda_percentual numeric(5,2) NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (produto_id, insumo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ficha_tecnica TO authenticated;
GRANT ALL ON public.ficha_tecnica TO service_role;
ALTER TABLE public.ficha_tecnica ENABLE ROW LEVEL SECURITY;
CREATE POLICY ficha_all_membro ON public.ficha_tecnica FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- MESAS
-- =========================================================
CREATE TABLE public.mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero text NOT NULL,
  capacidade int NOT NULL DEFAULT 4,
  area text,
  status public.status_mesa NOT NULL DEFAULT 'livre',
  qrcode_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesas TO authenticated;
GRANT ALL ON public.mesas TO service_role;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY mesa_all_membro ON public.mesas FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- COMANDAS / PEDIDOS
-- =========================================================
CREATE TABLE public.comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  mesa_id uuid REFERENCES public.mesas(id) ON DELETE SET NULL,
  numero serial,
  cliente_nome text,
  cliente_telefone text,
  garcom_id uuid REFERENCES auth.users(id),
  status public.status_comanda NOT NULL DEFAULT 'aberta',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  desconto numeric(12,2) NOT NULL DEFAULT 0,
  taxa_servico numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  observacao text,
  aberta_em timestamptz NOT NULL DEFAULT now(),
  fechada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comandas TO authenticated;
GRANT ALL ON public.comandas TO service_role;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY comanda_all_membro ON public.comandas FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

CREATE TABLE public.itens_comanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  comanda_id uuid NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  quantidade numeric(10,3) NOT NULL DEFAULT 1,
  preco_unitario numeric(12,2) NOT NULL,
  desconto numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status public.status_item NOT NULL DEFAULT 'pendente',
  observacao text,
  enviado_cozinha_em timestamptz,
  pronto_em timestamptz,
  entregue_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_comanda TO authenticated;
GRANT ALL ON public.itens_comanda TO service_role;
ALTER TABLE public.itens_comanda ENABLE ROW LEVEL SECURITY;
CREATE POLICY item_all_membro ON public.itens_comanda FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- PAGAMENTOS
-- =========================================================
CREATE TABLE public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  comanda_id uuid REFERENCES public.comandas(id) ON DELETE SET NULL,
  metodo public.metodo_pagamento NOT NULL,
  valor numeric(12,2) NOT NULL,
  troco numeric(12,2) NOT NULL DEFAULT 0,
  bandeira text,
  autorizacao text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY pagamento_all_membro ON public.pagamentos FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- FINANCEIRO
-- =========================================================
CREATE TABLE public.lancamentos_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo public.tipo_lancamento NOT NULL,
  categoria text NOT NULL,
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  pago boolean NOT NULL DEFAULT false,
  fornecedor_cliente text,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_financeiros TO authenticated;
GRANT ALL ON public.lancamentos_financeiros TO service_role;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY financ_all_gerencia ON public.lancamentos_financeiros FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id) OR public.has_company_role(auth.uid(), empresa_id, 'gerencia'))
  WITH CHECK (public.is_company_admin(auth.uid(), empresa_id) OR public.has_company_role(auth.uid(), empresa_id, 'gerencia'));

-- =========================================================
-- CLIENTES (CRM básico)
-- =========================================================
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  email text,
  cpf text,
  endereco text,
  aniversario date,
  observacao text,
  total_gasto numeric(12,2) NOT NULL DEFAULT 0,
  visitas int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY cliente_all_membro ON public.clientes FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_member(auth.uid(), empresa_id));

-- =========================================================
-- TRIGGERS updated_at
-- =========================================================
CREATE TRIGGER trg_upd_categorias BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_produtos BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_insumos BEFORE UPDATE ON public.insumos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_ficha BEFORE UPDATE ON public.ficha_tecnica FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_mesas BEFORE UPDATE ON public.mesas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_comandas BEFORE UPDATE ON public.comandas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_itens BEFORE UPDATE ON public.itens_comanda FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_financ BEFORE UPDATE ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_upd_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- FUNÇÕES DE NEGÓCIO
-- =========================================================

-- Recalcular totais da comanda a partir dos itens
CREATE OR REPLACE FUNCTION public.recalcular_comanda(_comanda_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_subtotal numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_subtotal
  FROM public.itens_comanda
  WHERE comanda_id = _comanda_id AND status <> 'cancelado';

  UPDATE public.comandas
  SET subtotal = v_subtotal,
      total = v_subtotal + taxa_servico - desconto,
      updated_at = now()
  WHERE id = _comanda_id;
END $$;

-- Trigger: calcular total do item e recalcular comanda
CREATE OR REPLACE FUNCTION public.tg_item_comanda()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'DELETE' THEN
    NEW.total := (NEW.quantidade * NEW.preco_unitario) - COALESCE(NEW.desconto, 0);
  END IF;
  PERFORM public.recalcular_comanda(COALESCE(NEW.comanda_id, OLD.comanda_id));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_item_calc
BEFORE INSERT OR UPDATE ON public.itens_comanda
FOR EACH ROW EXECUTE FUNCTION public.tg_item_comanda();

CREATE TRIGGER trg_item_recalc_del
AFTER DELETE ON public.itens_comanda
FOR EACH ROW EXECUTE FUNCTION public.tg_item_comanda();

-- Trigger: atualizar estoque a partir de movimento
CREATE OR REPLACE FUNCTION public.tg_movimento_estoque()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tipo IN ('entrada') THEN
    UPDATE public.insumos SET estoque_atual = estoque_atual + NEW.quantidade WHERE id = NEW.insumo_id;
  ELSIF NEW.tipo IN ('saida','perda') THEN
    UPDATE public.insumos SET estoque_atual = estoque_atual - NEW.quantidade WHERE id = NEW.insumo_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE public.insumos SET estoque_atual = NEW.quantidade WHERE id = NEW.insumo_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_mov_estoque
AFTER INSERT ON public.movimentos_estoque
FOR EACH ROW EXECUTE FUNCTION public.tg_movimento_estoque();

-- Trigger: liberar mesa ao fechar comanda
CREATE OR REPLACE FUNCTION public.tg_comanda_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'aberta' AND NEW.mesa_id IS NOT NULL THEN
    UPDATE public.mesas SET status = 'ocupada' WHERE id = NEW.mesa_id;
  ELSIF NEW.status IN ('fechada','cancelada') AND NEW.mesa_id IS NOT NULL THEN
    UPDATE public.mesas SET status = 'livre' WHERE id = NEW.mesa_id
      AND NOT EXISTS (SELECT 1 FROM public.comandas WHERE mesa_id = NEW.mesa_id AND status = 'aberta' AND id <> NEW.id);
    IF NEW.status = 'fechada' AND NEW.fechada_em IS NULL THEN
      NEW.fechada_em := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_comanda_status
BEFORE INSERT OR UPDATE OF status ON public.comandas
FOR EACH ROW EXECUTE FUNCTION public.tg_comanda_status();

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itens_comanda;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;

-- =========================================================
-- ÍNDICES
-- =========================================================
CREATE INDEX idx_produtos_empresa ON public.produtos(empresa_id);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_insumos_empresa ON public.insumos(empresa_id);
CREATE INDEX idx_mov_insumo ON public.movimentos_estoque(insumo_id, created_at DESC);
CREATE INDEX idx_comandas_empresa_status ON public.comandas(empresa_id, status);
CREATE INDEX idx_itens_comanda ON public.itens_comanda(comanda_id, status);
CREATE INDEX idx_itens_kds ON public.itens_comanda(empresa_id, status) WHERE status IN ('pendente','preparando');
CREATE INDEX idx_mesas_empresa ON public.mesas(empresa_id, status);
CREATE INDEX idx_financ_empresa ON public.lancamentos_financeiros(empresa_id, data_vencimento);
CREATE INDEX idx_clientes_empresa ON public.clientes(empresa_id);
