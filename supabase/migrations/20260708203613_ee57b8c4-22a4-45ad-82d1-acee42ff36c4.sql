
-- CRM module tables. All restricted to super_admins via is_super_admin().

-- 1. Prompts IA (editáveis)
CREATE TABLE public.crm_prompts_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  titulo text NOT NULL,
  template text NOT NULL,
  variaveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider text NOT NULL DEFAULT 'lovable',
  modelo text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_prompts_ia TO authenticated;
GRANT ALL ON public.crm_prompts_ia TO service_role;
ALTER TABLE public.crm_prompts_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_prompts_ia super admin" ON public.crm_prompts_ia FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 2. Categorias de leads (catálogo do scraper avançado)
CREATE TABLE public.crm_categorias_lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  grupo text,
  buscas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_categorias_lead TO authenticated;
GRANT ALL ON public.crm_categorias_lead TO service_role;
ALTER TABLE public.crm_categorias_lead ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_categorias_lead super admin" ON public.crm_categorias_lead FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. Agenda
CREATE TABLE public.crm_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'reuniao',
  inicio timestamptz NOT NULL,
  fim timestamptz,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'agendado',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_agenda TO authenticated;
GRANT ALL ON public.crm_agenda TO service_role;
ALTER TABLE public.crm_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_agenda super admin" ON public.crm_agenda FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 4. Templates de mensagens
CREATE TABLE public.crm_templates_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal text NOT NULL,
  nome text NOT NULL,
  assunto text,
  conteudo text NOT NULL,
  variaveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  tom text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_templates_mensagem TO authenticated;
GRANT ALL ON public.crm_templates_mensagem TO service_role;
ALTER TABLE public.crm_templates_mensagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_templates_mensagem super admin" ON public.crm_templates_mensagem FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 5. Mensagens (whatsapp/email/instagram/ligacao)
CREATE TABLE public.crm_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal text NOT NULL,
  direcao text NOT NULL DEFAULT 'saida',
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  assunto text,
  conteudo text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  template_id uuid REFERENCES public.crm_templates_mensagem(id) ON DELETE SET NULL,
  enviado_em timestamptz,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_mensagens TO authenticated;
GRANT ALL ON public.crm_mensagens TO service_role;
ALTER TABLE public.crm_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_mensagens super admin" ON public.crm_mensagens FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX crm_mensagens_lead_idx ON public.crm_mensagens(lead_id);
CREATE INDEX crm_mensagens_cliente_idx ON public.crm_mensagens(cliente_id);

-- 6. Conteúdos (Instagram/marketing)
CREATE TABLE public.crm_conteudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formato text NOT NULL,
  titulo text NOT NULL,
  legenda text,
  hashtags text,
  cta text,
  texto_arte text,
  descricao text,
  data_publicacao timestamptz,
  status text NOT NULL DEFAULT 'ideia',
  campanha_id uuid REFERENCES public.manager_campanhas(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_conteudos TO authenticated;
GRANT ALL ON public.crm_conteudos TO service_role;
ALTER TABLE public.crm_conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_conteudos super admin" ON public.crm_conteudos FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 7. Sequências e passos
CREATE TABLE public.crm_sequencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_sequencias TO authenticated;
GRANT ALL ON public.crm_sequencias TO service_role;
ALTER TABLE public.crm_sequencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_sequencias super admin" ON public.crm_sequencias FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.crm_sequencia_passos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequencia_id uuid NOT NULL REFERENCES public.crm_sequencias(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 1,
  dia integer NOT NULL DEFAULT 1,
  canal text NOT NULL,
  template_id uuid REFERENCES public.crm_templates_mensagem(id) ON DELETE SET NULL,
  condicao text,
  conteudo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_sequencia_passos TO authenticated;
GRANT ALL ON public.crm_sequencia_passos TO service_role;
ALTER TABLE public.crm_sequencia_passos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_sequencia_passos super admin" ON public.crm_sequencia_passos FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 8. Propostas
CREATE TABLE public.crm_propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE,
  titulo text NOT NULL,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE SET NULL,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  plano_id uuid REFERENCES public.manager_planos(id) ON DELETE SET NULL,
  valor_setup numeric(12,2) NOT NULL DEFAULT 0,
  valor_mensal numeric(12,2) NOT NULL DEFAULT 0,
  desconto numeric(12,2) NOT NULL DEFAULT 0,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text,
  validade date,
  status text NOT NULL DEFAULT 'rascunho',
  enviada_em timestamptz,
  aceite_em timestamptz,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_propostas TO authenticated;
GRANT ALL ON public.crm_propostas TO service_role;
ALTER TABLE public.crm_propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_propostas super admin" ON public.crm_propostas FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 9. Contratos
CREATE TABLE public.crm_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE,
  proposta_id uuid REFERENCES public.crm_propostas(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.manager_clientes(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  arquivo_url text,
  status text NOT NULL DEFAULT 'rascunho',
  assinado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contratos TO authenticated;
GRANT ALL ON public.crm_contratos TO service_role;
ALTER TABLE public.crm_contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_contratos super admin" ON public.crm_contratos FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 10. Checklist pós-venda
CREATE TABLE public.crm_checklist_implantacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.manager_clientes(id) ON DELETE CASCADE,
  etapas jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'em_andamento',
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  concluido_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_checklist_implantacao TO authenticated;
GRANT ALL ON public.crm_checklist_implantacao TO service_role;
ALTER TABLE public.crm_checklist_implantacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_checklist super admin" ON public.crm_checklist_implantacao FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Trigger updated_at genérico
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at') THEN
    CREATE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $f$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $f$;
  END IF;
END $$;

CREATE TRIGGER crm_prompts_ia_updated BEFORE UPDATE ON public.crm_prompts_ia FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_categorias_lead_updated BEFORE UPDATE ON public.crm_categorias_lead FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_agenda_updated BEFORE UPDATE ON public.crm_agenda FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_templates_mensagem_updated BEFORE UPDATE ON public.crm_templates_mensagem FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_mensagens_updated BEFORE UPDATE ON public.crm_mensagens FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_conteudos_updated BEFORE UPDATE ON public.crm_conteudos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_sequencias_updated BEFORE UPDATE ON public.crm_sequencias FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_sequencia_passos_updated BEFORE UPDATE ON public.crm_sequencia_passos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_propostas_updated BEFORE UPDATE ON public.crm_propostas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_contratos_updated BEFORE UPDATE ON public.crm_contratos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER crm_checklist_updated BEFORE UPDATE ON public.crm_checklist_implantacao FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seeds: categorias de leads pré-configuradas com buscas inteligentes
INSERT INTO public.crm_categorias_lead (nome, grupo, buscas) VALUES
  ('Hotel', 'Hospedagem', '["Hotel em {cidade}", "Hotel Fazenda em {cidade}", "Hotel Boutique em {cidade}", "Hotel Executivo em {cidade}"]'::jsonb),
  ('Pousada', 'Hospedagem', '["Pousada em {cidade}", "Pousada Beira Mar em {cidade}", "Pousada Romântica em {cidade}"]'::jsonb),
  ('Resort', 'Hospedagem', '["Resort em {cidade}", "Resort All Inclusive em {cidade}"]'::jsonb),
  ('Hostel', 'Hospedagem', '["Hostel em {cidade}", "Albergue em {cidade}"]'::jsonb),
  ('Clínica Médica', 'Saúde', '["Clínica Médica em {cidade}", "Clínica Popular em {cidade}"]'::jsonb),
  ('Clínica Odontológica', 'Saúde', '["Clínica Odontológica em {cidade}", "Dentista em {cidade}", "Clínica de Ortodontia em {cidade}"]'::jsonb),
  ('Clínica de Estética', 'Saúde', '["Clínica de Estética em {cidade}", "Clínica Dermatológica em {cidade}", "Harmonização Facial em {cidade}"]'::jsonb),
  ('Restaurante', 'Alimentação', '["Restaurante em {cidade}", "Restaurante Italiano em {cidade}", "Restaurante Japonês em {cidade}", "Churrascaria em {cidade}"]'::jsonb),
  ('Pizzaria', 'Alimentação', '["Pizzaria em {cidade}", "Pizzaria Delivery em {cidade}"]'::jsonb),
  ('Padaria', 'Alimentação', '["Padaria em {cidade}", "Confeitaria em {cidade}"]'::jsonb),
  ('Bar', 'Alimentação', '["Bar em {cidade}", "Choperia em {cidade}", "Pub em {cidade}"]'::jsonb),
  ('Hamburgueria', 'Alimentação', '["Hamburgueria em {cidade}", "Burger em {cidade}"]'::jsonb),
  ('Pet Shop', 'Serviços', '["Pet Shop em {cidade}", "Banho e Tosa em {cidade}", "Clínica Veterinária em {cidade}"]'::jsonb),
  ('Academia', 'Fitness', '["Academia em {cidade}", "Academia Crossfit em {cidade}", "Studio Pilates em {cidade}", "Box Crossfit em {cidade}"]'::jsonb),
  ('Auto Escola', 'Educação', '["Auto Escola em {cidade}", "CFC em {cidade}"]'::jsonb),
  ('Escola', 'Educação', '["Escola em {cidade}", "Escola Particular em {cidade}", "Escola de Idiomas em {cidade}"]'::jsonb),
  ('Loja de Roupas', 'Varejo', '["Loja de Roupas em {cidade}", "Boutique em {cidade}", "Loja de Moda Feminina em {cidade}"]'::jsonb),
  ('Mercado', 'Varejo', '["Mercado em {cidade}", "Supermercado em {cidade}", "Mercadinho em {cidade}"]'::jsonb),
  ('Construtora', 'Construção', '["Construtora em {cidade}", "Incorporadora em {cidade}"]'::jsonb),
  ('Advogado', 'Serviços', '["Escritório de Advocacia em {cidade}", "Advogado Trabalhista em {cidade}", "Advogado Empresarial em {cidade}"]'::jsonb),
  ('Contabilidade', 'Serviços', '["Escritório de Contabilidade em {cidade}", "Contador em {cidade}"]'::jsonb),
  ('Salão de Beleza', 'Estética', '["Salão de Beleza em {cidade}", "Barbearia em {cidade}", "Studio de Unhas em {cidade}"]'::jsonb),
  ('Oficina Mecânica', 'Automotivo', '["Oficina Mecânica em {cidade}", "Auto Center em {cidade}", "Funilaria em {cidade}"]'::jsonb),
  ('Farmácia', 'Saúde', '["Farmácia em {cidade}", "Drogaria em {cidade}", "Farmácia de Manipulação em {cidade}"]'::jsonb)
ON CONFLICT (nome) DO NOTHING;

-- Seeds: prompts de IA padrão
INSERT INTO public.crm_prompts_ia (chave, titulo, template, variaveis) VALUES
  ('analisar_lead', 'Análise de Lead', 'Você é um consultor de vendas B2B da AMT Sistemas (ERP para restaurantes, clínicas, hotéis, comércio). Analise o lead abaixo e retorne em JSON: {resumo, probabilidade_compra (0-100), problemas_provaveis[], sistema_recomendado, abordagem_sugerida}. Lead: {lead_json}', '["lead_json"]'::jsonb),
  ('mensagem_whatsapp', 'Mensagem WhatsApp', 'Você é um SDR consultivo. Escreva UMA mensagem curta (máx 4 linhas) de WhatsApp em português BR, tom {tom}, para o lead {empresa} do segmento {categoria}. Objetivo: {objetivo}. Sem emojis excessivos. Sem link.', '["empresa","categoria","tom","objetivo"]'::jsonb),
  ('email_prospeccao', 'Email Prospecção', 'Escreva um email de prospecção B2B para {empresa} ({categoria}). Tom {tom}. Formato: assunto + corpo (max 120 palavras). CTA: {cta}. Em português BR.', '["empresa","categoria","tom","cta"]'::jsonb),
  ('post_instagram', 'Post Instagram', 'Crie um post de Instagram formato {formato} sobre {tema} para AMT Sistemas. Retorne JSON: {titulo, legenda (max 220c), hashtags (10 relevantes), cta, texto_arte (frase curta para overlay)}.', '["formato","tema"]'::jsonb),
  ('copy_generica', 'Copy Genérica', 'Gere copy para {canal} com objetivo {objetivo}, tom {tom}, sobre {tema}. Retorne JSON: {headline, subheadline, cta, texto_curto, texto_longo}.', '["canal","objetivo","tom","tema"]'::jsonb)
ON CONFLICT (chave) DO NOTHING;
