
GRANT EXECUTE ON FUNCTION public.tg_comanda_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_item_comanda() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_movimento_estoque() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_recalc_pedido_compra() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_ficha_tecnica_recalc() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_insumo_custo_recalc() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_empresa_criada() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tg_empresa_trial() TO authenticated, service_role;
