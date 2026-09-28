
CREATE TABLE public.manager_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE,
  assunto text NOT NULL,
  descricao text,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  categoria text NOT NULL DEFAULT 'duvida',
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'aberto',
  canal text NOT NULL DEFAULT 'painel',
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  solicitante_nome text,
  solicitante_email text,
  fechado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_tickets TO authenticated;
GRANT ALL ON public.manager_tickets TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.manager_tickets_numero_seq TO authenticated;
ALTER TABLE public.manager_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage tickets" ON public.manager_tickets FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.manager_tickets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_ticket_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.manager_tickets(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  autor_tipo text NOT NULL DEFAULT 'agente',
  autor_nome text,
  mensagem text NOT NULL,
  interna boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_ticket_mensagens TO authenticated;
GRANT ALL ON public.manager_ticket_mensagens TO service_role;
ALTER TABLE public.manager_ticket_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins manage ticket msgs" ON public.manager_ticket_mensagens FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX idx_tickets_status ON public.manager_tickets(status);
CREATE INDEX idx_tickets_prioridade ON public.manager_tickets(prioridade);
CREATE INDEX idx_ticket_msgs ON public.manager_ticket_mensagens(ticket_id, created_at);
