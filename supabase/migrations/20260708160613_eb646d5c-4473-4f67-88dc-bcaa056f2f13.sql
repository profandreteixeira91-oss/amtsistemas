
-- Extend tickets with solicitante_id / empresa_id
ALTER TABLE public.manager_tickets
  ADD COLUMN IF NOT EXISTS solicitante_id uuid,
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

CREATE INDEX IF NOT EXISTS manager_tickets_solicitante_idx ON public.manager_tickets (solicitante_id);
CREATE INDEX IF NOT EXISTS manager_tickets_status_idx ON public.manager_tickets (status);
CREATE INDEX IF NOT EXISTS ticket_msgs_ticket_idx ON public.manager_ticket_mensagens (ticket_id, created_at);

-- End-user policies on tickets
CREATE POLICY "tickets_select_own"
ON public.manager_tickets FOR SELECT
TO authenticated
USING (solicitante_id = auth.uid());

CREATE POLICY "tickets_insert_own"
ON public.manager_tickets FOR INSERT
TO authenticated
WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "tickets_update_own"
ON public.manager_tickets FOR UPDATE
TO authenticated
USING (solicitante_id = auth.uid())
WITH CHECK (solicitante_id = auth.uid());

-- End-user policies on messages (non-internal only)
CREATE POLICY "ticket_msgs_select_own"
ON public.manager_ticket_mensagens FOR SELECT
TO authenticated
USING (
  interna = false
  AND EXISTS (
    SELECT 1 FROM public.manager_tickets t
    WHERE t.id = ticket_id AND t.solicitante_id = auth.uid()
  )
);

CREATE POLICY "ticket_msgs_insert_own"
ON public.manager_ticket_mensagens FOR INSERT
TO authenticated
WITH CHECK (
  interna = false
  AND autor_tipo = 'cliente'
  AND autor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.manager_tickets t
    WHERE t.id = ticket_id AND t.solicitante_id = auth.uid()
  )
);

-- Bump ticket updated_at when a new message is added
CREATE OR REPLACE FUNCTION public.tg_ticket_bump_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.manager_tickets
     SET updated_at = now()
   WHERE id = NEW.ticket_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ticket_msgs_bump ON public.manager_ticket_mensagens;
CREATE TRIGGER ticket_msgs_bump
AFTER INSERT ON public.manager_ticket_mensagens
FOR EACH ROW EXECUTE FUNCTION public.tg_ticket_bump_updated();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.manager_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.manager_ticket_mensagens;
ALTER TABLE public.manager_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.manager_ticket_mensagens REPLICA IDENTITY FULL;
