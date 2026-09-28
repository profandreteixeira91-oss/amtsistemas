-- =========================================================
-- Fase 7: Workflow builder + Relatórios/BI
-- =========================================================

-- ── Workflows ─────────────────────────────────────
CREATE TABLE public.crm_workflows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  descricao       text,
  ativo           boolean NOT NULL DEFAULT true,
  gatilho_tipo    text NOT NULL, -- lead_novo | score_atingido | stage_alterado | sem_contato_dias | manual | agendado
  gatilho_config  jsonb NOT NULL DEFAULT '{}'::jsonb,
  definicao       jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  ultima_execucao timestamptz,
  execucoes_total integer NOT NULL DEFAULT 0,
  execucoes_ok    integer NOT NULL DEFAULT 0,
  execucoes_erro  integer NOT NULL DEFAULT 0,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_workflows TO authenticated;
GRANT ALL ON public.crm_workflows TO service_role;

ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows super_admin"
  ON public.crm_workflows FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_crm_workflows_updated
  BEFORE UPDATE ON public.crm_workflows
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_crm_workflows_ativo ON public.crm_workflows (ativo, gatilho_tipo);

-- ── Execuções de workflows ─────────────────────────
CREATE TABLE public.crm_workflow_execucoes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id    uuid NOT NULL REFERENCES public.crm_workflows(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'em_execucao', -- em_execucao | ok | erro
  origem         text, -- manual | tick | trigger | webhook
  contexto       jsonb NOT NULL DEFAULT '{}'::jsonb,
  log_passos     jsonb NOT NULL DEFAULT '[]'::jsonb,
  erro_mensagem  text,
  duracao_ms     integer,
  iniciado_em    timestamptz NOT NULL DEFAULT now(),
  finalizado_em  timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_workflow_execucoes TO authenticated;
GRANT ALL ON public.crm_workflow_execucoes TO service_role;

ALTER TABLE public.crm_workflow_execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_execucoes super_admin"
  ON public.crm_workflow_execucoes FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX idx_crm_wf_execs_wf ON public.crm_workflow_execucoes (workflow_id, iniciado_em DESC);

-- ── Relatórios salvos ─────────────────────────────
CREATE TABLE public.crm_relatorios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  descricao       text,
  fonte           text NOT NULL, -- leads | propostas | contratos | mensagens | financeiro | atividades
  colunas         jsonb NOT NULL DEFAULT '[]'::jsonb,
  filtros         jsonb NOT NULL DEFAULT '[]'::jsonb,
  agrupamento     jsonb NOT NULL DEFAULT '{}'::jsonb,
  ordenacao       jsonb NOT NULL DEFAULT '[]'::jsonb,
  limite          integer DEFAULT 500,
  chart_tipo      text DEFAULT 'tabela', -- tabela | barra | linha | pizza | kpi
  chart_config    jsonb NOT NULL DEFAULT '{}'::jsonb,
  favorito        boolean NOT NULL DEFAULT false,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_relatorios TO authenticated;
GRANT ALL ON public.crm_relatorios TO service_role;

ALTER TABLE public.crm_relatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relatorios super_admin"
  ON public.crm_relatorios FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_crm_relatorios_updated
  BEFORE UPDATE ON public.crm_relatorios
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ── Agendamentos de relatórios ─────────────────────
CREATE TABLE public.crm_relatorios_agendamentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id    uuid NOT NULL REFERENCES public.crm_relatorios(id) ON DELETE CASCADE,
  frequencia      text NOT NULL, -- diario | semanal | mensal
  hora            text NOT NULL DEFAULT '08:00', -- HH:MM
  dia_semana      integer, -- 0-6 (para semanal)
  dia_mes         integer, -- 1-31 (para mensal)
  destinatarios   text[] NOT NULL DEFAULT '{}',
  formato         text NOT NULL DEFAULT 'csv', -- csv | resumo
  ativo           boolean NOT NULL DEFAULT true,
  proximo_disparo timestamptz,
  ultimo_disparo  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_relatorios_agendamentos TO authenticated;
GRANT ALL ON public.crm_relatorios_agendamentos TO service_role;

ALTER TABLE public.crm_relatorios_agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relatorios_agend super_admin"
  ON public.crm_relatorios_agendamentos FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_crm_rel_agend_updated
  BEFORE UPDATE ON public.crm_relatorios_agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_crm_rel_agend_ativo ON public.crm_relatorios_agendamentos (ativo, proximo_disparo);
