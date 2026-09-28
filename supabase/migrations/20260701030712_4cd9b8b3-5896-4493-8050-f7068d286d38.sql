
-- Assinaturas / trial
CREATE TYPE public.assinatura_status AS ENUM ('trial','ativa','vencida','cancelada');

CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL UNIQUE REFERENCES public.empresas(id) ON DELETE CASCADE,
  plano text NOT NULL DEFAULT 'starter',
  ciclo text NOT NULL DEFAULT 'mensal',
  status public.assinatura_status NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancelada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem assinatura da empresa" ON public.assinaturas
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), empresa_id));

CREATE POLICY "Admins gerenciam assinatura da empresa" ON public.assinaturas
  FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), empresa_id))
  WITH CHECK (public.is_company_admin(auth.uid(), empresa_id));

CREATE TRIGGER trg_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-cria assinatura trial de 14 dias ao criar empresa
CREATE OR REPLACE FUNCTION public.tg_empresa_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.assinaturas (empresa_id, plano, ciclo, status, trial_ends_at, current_period_end)
  VALUES (NEW.id, 'starter', 'mensal', 'trial', now() + interval '14 days', now() + interval '14 days')
  ON CONFLICT (empresa_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_empresa_trial
  AFTER INSERT ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.tg_empresa_trial();
