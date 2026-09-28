
-- Função apenas para calcular o total da linha (BEFORE)
CREATE OR REPLACE FUNCTION public.tg_item_calc_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.total := (NEW.quantidade * NEW.preco_unitario) - COALESCE(NEW.desconto, 0);
  RETURN NEW;
END $$;

-- Função de recálculo da comanda (AFTER) — enxerga a linha já persistida
CREATE OR REPLACE FUNCTION public.tg_item_recalc_comanda()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recalcular_comanda(COALESCE(NEW.comanda_id, OLD.comanda_id));
  RETURN COALESCE(NEW, OLD);
END $$;

GRANT EXECUTE ON FUNCTION public.tg_item_calc_total() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_item_recalc_comanda() TO authenticated, service_role;

-- Troca os triggers
DROP TRIGGER IF EXISTS trg_item_calc ON public.itens_comanda;
DROP TRIGGER IF EXISTS trg_item_recalc_del ON public.itens_comanda;

CREATE TRIGGER trg_item_calc_before
  BEFORE INSERT OR UPDATE ON public.itens_comanda
  FOR EACH ROW EXECUTE FUNCTION public.tg_item_calc_total();

CREATE TRIGGER trg_item_recalc_after
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_comanda
  FOR EACH ROW EXECUTE FUNCTION public.tg_item_recalc_comanda();
