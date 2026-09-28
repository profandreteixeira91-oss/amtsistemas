
REVOKE EXECUTE ON FUNCTION public.recalcular_custo_produto(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalcular_custo_produto(uuid) TO service_role;
