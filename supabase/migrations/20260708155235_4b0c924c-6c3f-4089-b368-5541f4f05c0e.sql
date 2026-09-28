
CREATE TABLE public.manager_monitor_alvos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'http' CHECK (tipo IN ('http','ping')),
  url text NOT NULL,
  metodo text NOT NULL DEFAULT 'GET' CHECK (metodo IN ('GET','POST','HEAD')),
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  esperado_status integer NOT NULL DEFAULT 200,
  intervalo_minutos integer NOT NULL DEFAULT 5,
  timeout_segundos integer NOT NULL DEFAULT 10,
  ativo boolean NOT NULL DEFAULT true,
  ultimo_check_em timestamptz,
  ultimo_status text,
  ultima_latencia_ms integer,
  ultimo_erro text,
  uptime_24h numeric(5,2),
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_monitor_alvos TO authenticated;
GRANT ALL ON public.manager_monitor_alvos TO service_role;

ALTER TABLE public.manager_monitor_alvos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitor_alvos_super_admin_all"
ON public.manager_monitor_alvos FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER monitor_alvos_set_updated_at
BEFORE UPDATE ON public.manager_monitor_alvos
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.manager_monitor_checks (
  id bigserial PRIMARY KEY,
  alvo_id uuid NOT NULL REFERENCES public.manager_monitor_alvos(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('up','down','degraded','timeout')),
  http_status integer,
  latencia_ms integer,
  erro text,
  checado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.manager_monitor_checks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.manager_monitor_checks_id_seq TO authenticated;
GRANT ALL ON public.manager_monitor_checks TO service_role;
GRANT ALL ON SEQUENCE public.manager_monitor_checks_id_seq TO service_role;

ALTER TABLE public.manager_monitor_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitor_checks_super_admin_all"
ON public.manager_monitor_checks FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX monitor_checks_alvo_data_idx ON public.manager_monitor_checks (alvo_id, checado_em DESC);
CREATE INDEX monitor_alvos_ativo_idx ON public.manager_monitor_alvos (ativo);
