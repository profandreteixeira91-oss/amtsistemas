
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.super_admins TO authenticated;
GRANT ALL ON public.super_admins TO service_role;

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
$$;

DROP POLICY IF EXISTS "Usuário vê próprio status de super admin" ON public.super_admins;
CREATE POLICY "Usuário vê próprio status de super admin"
ON public.super_admins FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins gerenciam super admins" ON public.super_admins;
CREATE POLICY "Super admins gerenciam super admins"
ON public.super_admins FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Bootstrap: promove o email fundador se já existir
INSERT INTO public.super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'andre.teixeira.at@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
