
ALTER FUNCTION public.tg_item_comanda() SET search_path = public;
ALTER FUNCTION public.tg_movimento_estoque() SET search_path = public;
ALTER FUNCTION public.tg_comanda_status() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.recalcular_comanda(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_item_comanda() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_movimento_estoque() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_comanda_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_empresa_criada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_novo_usuario() FROM PUBLIC, anon, authenticated;
