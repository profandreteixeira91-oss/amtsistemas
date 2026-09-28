
CREATE TABLE public.contatos_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  empresa TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  segmento TEXT,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contatos_leads TO anon, authenticated;
GRANT SELECT ON public.contatos_leads TO authenticated;
GRANT ALL ON public.contatos_leads TO service_role;

ALTER TABLE public.contatos_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode enviar contato"
ON public.contatos_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(nome) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 200
  AND length(mensagem) BETWEEN 1 AND 4000
);
