
CREATE TABLE public.manager_cobrancas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.manager_clientes(id) ON DELETE CASCADE,
  assinatura_id UUID REFERENCES public.manager_assinaturas(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta',
  pago_em TIMESTAMPTZ,
  forma_pagamento TEXT,
  external_ref TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_cobrancas TO authenticated;
GRANT ALL ON public.manager_cobrancas TO service_role;
ALTER TABLE public.manager_cobrancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia cobrancas" ON public.manager_cobrancas
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_manager_cobrancas_updated BEFORE UPDATE ON public.manager_cobrancas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_manager_cobrancas_cliente ON public.manager_cobrancas(cliente_id);
CREATE INDEX idx_manager_cobrancas_status ON public.manager_cobrancas(status);
CREATE INDEX idx_manager_cobrancas_vencimento ON public.manager_cobrancas(vencimento);

CREATE TABLE public.manager_transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  categoria TEXT,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  cobranca_id UUID REFERENCES public.manager_cobrancas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_transacoes TO authenticated;
GRANT ALL ON public.manager_transacoes TO service_role;
ALTER TABLE public.manager_transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia transacoes" ON public.manager_transacoes
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_manager_transacoes_updated BEFORE UPDATE ON public.manager_transacoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_manager_transacoes_tipo ON public.manager_transacoes(tipo);
CREATE INDEX idx_manager_transacoes_data ON public.manager_transacoes(data);

-- Trigger: quando cobrança vira "paga", cria transação de receita
CREATE OR REPLACE FUNCTION public.tg_cobranca_paga()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paga' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paga') THEN
    IF NEW.pago_em IS NULL THEN
      NEW.pago_em := now();
    END IF;
    INSERT INTO public.manager_transacoes (tipo, categoria, descricao, valor, data, forma_pagamento, cobranca_id, cliente_id)
    VALUES ('receita', 'assinatura', NEW.descricao, NEW.valor, COALESCE(NEW.pago_em::date, CURRENT_DATE), NEW.forma_pagamento, NEW.id, NEW.cliente_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cobranca_paga
  BEFORE INSERT OR UPDATE ON public.manager_cobrancas
  FOR EACH ROW EXECUTE FUNCTION public.tg_cobranca_paga();

-- Marca automaticamente cobranças vencidas como 'vencida' (via consulta; sem cron)
