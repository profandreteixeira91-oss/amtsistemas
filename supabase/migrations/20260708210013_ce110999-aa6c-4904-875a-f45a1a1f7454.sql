
ALTER TABLE public.crm_mensagens
  ADD COLUMN IF NOT EXISTS destinatario text;
