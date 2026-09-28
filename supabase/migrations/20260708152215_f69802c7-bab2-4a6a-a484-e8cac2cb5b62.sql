
CREATE TABLE public.manager_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensagem TEXT,
  categoria TEXT NOT NULL DEFAULT 'sistema' CHECK (categoria IN ('sistema','cliente','cobranca','lead','ticket','marketing','alerta')),
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa','normal','alta','urgente')),
  link TEXT,
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origem TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  arquivada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_notificacoes TO authenticated;
GRANT ALL ON public.manager_notificacoes TO service_role;

ALTER TABLE public.manager_notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage notifications"
  ON public.manager_notificacoes FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX idx_manager_notif_created ON public.manager_notificacoes(created_at DESC);
CREATE INDEX idx_manager_notif_dest ON public.manager_notificacoes(destinatario_id);

CREATE TABLE public.manager_notificacoes_leituras (
  notificacao_id UUID NOT NULL REFERENCES public.manager_notificacoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notificacao_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.manager_notificacoes_leituras TO authenticated;
GRANT ALL ON public.manager_notificacoes_leituras TO service_role;

ALTER TABLE public.manager_notificacoes_leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own reads"
  ON public.manager_notificacoes_leituras FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
