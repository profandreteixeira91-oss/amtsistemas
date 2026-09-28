
-- RLS para bucket empresa-logos: membros da empresa podem ler; admins/gerencia podem escrever
CREATE POLICY "membros_leem_logo_empresa"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'empresa-logos'
  AND EXISTS (
    SELECT 1 FROM public.membros m
    WHERE m.user_id = auth.uid()
      AND m.ativo = true
      AND m.empresa_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "admins_gerenciam_logo_empresa"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'empresa-logos'
  AND EXISTS (
    SELECT 1 FROM public.membros m
    WHERE m.user_id = auth.uid()
      AND m.ativo = true
      AND m.empresa_id::text = (storage.foldername(name))[1]
      AND m.role IN ('admin','gerencia')
  )
)
WITH CHECK (
  bucket_id = 'empresa-logos'
  AND EXISTS (
    SELECT 1 FROM public.membros m
    WHERE m.user_id = auth.uid()
      AND m.ativo = true
      AND m.empresa_id::text = (storage.foldername(name))[1]
      AND m.role IN ('admin','gerencia')
  )
);
