
CREATE OR REPLACE FUNCTION public.recalcular_custo_produto(_produto_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_custo numeric(12,4);
BEGIN
  SELECT COALESCE(SUM(
    i.custo_unitario * ft.quantidade * (1 + COALESCE(ft.perda_percentual, 0) / 100.0)
  ), 0)
  INTO v_custo
  FROM public.ficha_tecnica ft
  JOIN public.insumos i ON i.id = ft.insumo_id
  WHERE ft.produto_id = _produto_id;

  UPDATE public.produtos
  SET custo = v_custo, updated_at = now()
  WHERE id = _produto_id;
END $$;

CREATE OR REPLACE FUNCTION public.tg_ficha_tecnica_recalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalcular_custo_produto(OLD.produto_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalcular_custo_produto(NEW.produto_id);
    IF TG_OP = 'UPDATE' AND OLD.produto_id IS DISTINCT FROM NEW.produto_id THEN
      PERFORM public.recalcular_custo_produto(OLD.produto_id);
    END IF;
    RETURN NEW;
  END IF;
END $$;

DROP TRIGGER IF EXISTS tg_ficha_tecnica_recalc ON public.ficha_tecnica;
CREATE TRIGGER tg_ficha_tecnica_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.ficha_tecnica
FOR EACH ROW EXECUTE FUNCTION public.tg_ficha_tecnica_recalc();

CREATE OR REPLACE FUNCTION public.tg_insumo_custo_recalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.custo_unitario IS DISTINCT FROM OLD.custo_unitario THEN
    FOR r IN SELECT DISTINCT produto_id FROM public.ficha_tecnica WHERE insumo_id = NEW.id LOOP
      PERFORM public.recalcular_custo_produto(r.produto_id);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_insumo_custo_recalc ON public.insumos;
CREATE TRIGGER tg_insumo_custo_recalc
AFTER UPDATE OF custo_unitario ON public.insumos
FOR EACH ROW EXECUTE FUNCTION public.tg_insumo_custo_recalc();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT produto_id FROM public.ficha_tecnica LOOP
    PERFORM public.recalcular_custo_produto(r.produto_id);
  END LOOP;
END $$;
