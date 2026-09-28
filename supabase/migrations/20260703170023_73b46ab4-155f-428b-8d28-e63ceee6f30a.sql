
-- Tipo de promoção
DO $$ BEGIN
  CREATE TYPE public.tipo_promocao AS ENUM ('percentual', 'valor_fixo', 'combo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela principal
CREATE TABLE public.promocoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  tipo public.tipo_promocao NOT NULL DEFAULT 'percentual',
  valor numeric(12,2) NOT NULL DEFAULT 0,
  preco_combo numeric(12,2),
  inicio_em timestamptz,
  fim_em timestamptz,
  ativa boolean NOT NULL DEFAULT true,
  criada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promocoes TO authenticated;
GRANT ALL ON public.promocoes TO service_role;

ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem promoções"
  ON public.promocoes FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY "Admins gerenciam promoções"
  ON public.promocoes FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_admin(auth.uid(), empresa_id));

CREATE TRIGGER trg_promocoes_updated_at
  BEFORE UPDATE ON public.promocoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Itens vinculados
CREATE TABLE public.promocao_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promocao_id uuid NOT NULL REFERENCES public.promocoes(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promocao_id, produto_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promocao_produtos TO authenticated;
GRANT ALL ON public.promocao_produtos TO service_role;

ALTER TABLE public.promocao_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem itens de promoção"
  ON public.promocao_produtos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.promocoes p
    WHERE p.id = promocao_id AND public.is_company_member(auth.uid(), p.empresa_id)
  ));

CREATE POLICY "Admins gerenciam itens de promoção"
  ON public.promocao_produtos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.promocoes p
    WHERE p.id = promocao_id AND public.is_company_admin(auth.uid(), p.empresa_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.promocoes p
    WHERE p.id = promocao_id AND public.is_company_admin(auth.uid(), p.empresa_id)
  ));

CREATE INDEX idx_promocoes_empresa ON public.promocoes(empresa_id);
CREATE INDEX idx_promocao_produtos_promo ON public.promocao_produtos(promocao_id);
CREATE INDEX idx_promocao_produtos_produto ON public.promocao_produtos(produto_id);
