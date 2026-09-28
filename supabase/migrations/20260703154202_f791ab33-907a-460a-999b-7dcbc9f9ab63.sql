
CREATE POLICY "produto_fotos_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'produto-fotos' AND public.is_company_member(auth.uid(), (split_part(name, '/', 1))::uuid));

CREATE POLICY "produto_fotos_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'produto-fotos' AND public.is_company_member(auth.uid(), (split_part(name, '/', 1))::uuid));

CREATE POLICY "produto_fotos_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'produto-fotos' AND public.is_company_member(auth.uid(), (split_part(name, '/', 1))::uuid));

CREATE POLICY "produto_fotos_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'produto-fotos' AND public.is_company_member(auth.uid(), (split_part(name, '/', 1))::uuid));
