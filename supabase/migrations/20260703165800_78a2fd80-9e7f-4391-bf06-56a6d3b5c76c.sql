
-- Add percentage-based service fee (default 10%)
ALTER TABLE public.comandas
  ADD COLUMN IF NOT EXISTS taxa_servico_percentual numeric(5,2) NOT NULL DEFAULT 10;

-- Recalculate function now derives taxa_servico from the percentage over the subtotal
CREATE OR REPLACE FUNCTION public.recalcular_comanda(_comanda_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subtotal numeric(12,2);
  v_perc     numeric(5,2);
  v_taxa     numeric(12,2);
  v_desc     numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_subtotal
  FROM public.itens_comanda
  WHERE comanda_id = _comanda_id AND status <> 'cancelado';

  SELECT COALESCE(taxa_servico_percentual, 10), COALESCE(desconto, 0)
    INTO v_perc, v_desc
  FROM public.comandas WHERE id = _comanda_id;

  v_taxa := ROUND(v_subtotal * v_perc / 100.0, 2);

  UPDATE public.comandas
  SET subtotal = v_subtotal,
      taxa_servico = v_taxa,
      total = v_subtotal + v_taxa - v_desc,
      updated_at = now()
  WHERE id = _comanda_id;
END $function$;

GRANT EXECUTE ON FUNCTION public.recalcular_comanda(uuid) TO authenticated, service_role;

-- Ensure realtime carries full row payloads
ALTER TABLE public.comandas REPLICA IDENTITY FULL;
ALTER TABLE public.itens_comanda REPLICA IDENTITY FULL;

-- Backfill existing rows with the 10% default when they still hold zero taxa
UPDATE public.comandas c
SET taxa_servico = ROUND(subtotal * taxa_servico_percentual / 100.0, 2),
    total = subtotal + ROUND(subtotal * taxa_servico_percentual / 100.0, 2) - COALESCE(desconto,0)
WHERE status IN ('aberta','em_pagamento');
