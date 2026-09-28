
-- Fase 2 AMT Master Admin: config comercial + Asaas webhook/retry + override modulos por assinatura

ALTER TABLE public.manager_sistemas
  ADD COLUMN IF NOT EXISTS configuracoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pitch_comercial text,
  ADD COLUMN IF NOT EXISTS suporte_whatsapp text,
  ADD COLUMN IF NOT EXISTS suporte_email text;

-- Override de módulos por assinatura (permite liberar/bloquear pontualmente)
CREATE TABLE IF NOT EXISTS public.amt_assinatura_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id uuid NOT NULL REFERENCES public.manager_assinaturas(id) ON DELETE CASCADE,
  modulo_id uuid NOT NULL REFERENCES public.amt_modulos(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('liberado','bloqueado')),
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assinatura_id, modulo_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.amt_assinatura_modulos TO authenticated;
GRANT ALL ON public.amt_assinatura_modulos TO service_role;
ALTER TABLE public.amt_assinatura_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin gerencia overrides" ON public.amt_assinatura_modulos
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Log de execuções da fila Asaas
CREATE TABLE IF NOT EXISTS public.amt_asaas_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fila_id uuid REFERENCES public.amt_asaas_fila(id) ON DELETE SET NULL,
  direcao text NOT NULL CHECK (direcao IN ('out','in')),
  tipo text NOT NULL,
  status_http integer,
  request jsonb,
  response jsonb,
  erro text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.amt_asaas_logs TO authenticated;
GRANT ALL ON public.amt_asaas_logs TO service_role;
ALTER TABLE public.amt_asaas_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin le logs asaas" ON public.amt_asaas_logs
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- Cron para processar fila Asaas a cada 5 minutos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'amt-asaas-tick') THEN
    PERFORM cron.schedule(
      'amt-asaas-tick',
      '*/5 * * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://project--9004f8a7-a4e5-4c85-a320-7cc61b2f87a4.lovable.app/api/public/hooks/asaas-tick',
        headers := jsonb_build_object('Content-Type','application/json','apikey','sb_publishable_iPhBniyOxvGZr7y792F6XQ_q0_72JcQ'),
        body := '{}'::jsonb
      );
      $cron$
    );
  END IF;
END $$;
