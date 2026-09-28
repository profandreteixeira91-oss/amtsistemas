
-- Allow super admins to read the entire audit trail
CREATE POLICY "auditoria_select_super_admin"
ON public.auditoria
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to insert manager-level audit records (empresa_id null)
CREATE POLICY "auditoria_insert_super_admin"
ON public.auditoria
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) AND user_id = auth.uid());

-- Helpful indexes for filters and pagination
CREATE INDEX IF NOT EXISTS auditoria_created_at_idx ON public.auditoria (created_at DESC);
CREATE INDEX IF NOT EXISTS auditoria_user_id_idx ON public.auditoria (user_id);
CREATE INDEX IF NOT EXISTS auditoria_entidade_idx ON public.auditoria (entidade);
CREATE INDEX IF NOT EXISTS auditoria_acao_idx ON public.auditoria (acao);
CREATE INDEX IF NOT EXISTS auditoria_empresa_id_idx ON public.auditoria (empresa_id);
