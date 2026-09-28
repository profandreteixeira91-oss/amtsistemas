
-- === Nichos por sistema ===
CREATE TABLE public.manager_scraper_nichos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema_id uuid NOT NULL REFERENCES public.manager_sistemas(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nome text NOT NULL,
  termos text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sistema_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_scraper_nichos TO authenticated;
GRANT ALL ON public.manager_scraper_nichos TO service_role;
ALTER TABLE public.manager_scraper_nichos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins gerenciam nichos" ON public.manager_scraper_nichos
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_scraper_nichos_updated BEFORE UPDATE ON public.manager_scraper_nichos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- === Cidades brasileiras (seed para buscas em massa) ===
CREATE TABLE public.manager_scraper_cidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uf text NOT NULL,
  nome text NOT NULL,
  populacao int,
  latitude numeric(9,6),
  longitude numeric(9,6),
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (uf, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_scraper_cidades TO authenticated;
GRANT ALL ON public.manager_scraper_cidades TO service_role;
ALTER TABLE public.manager_scraper_cidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins gerenciam cidades" ON public.manager_scraper_cidades
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_scraper_cidades_uf ON public.manager_scraper_cidades(uf);

-- === Extensão de manager_scraper_buscas ===
ALTER TABLE public.manager_scraper_buscas
  ADD COLUMN IF NOT EXISTS nichos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS escopo text NOT NULL DEFAULT 'cidade',
  ADD COLUMN IF NOT EXISTS uf text,
  ADD COLUMN IF NOT EXISTS raio_km int,
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS cidade_atual text,
  ADD COLUMN IF NOT EXISTS total_cidades int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cidades_processadas int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contadores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cancelada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS iniciado_em timestamptz,
  ADD COLUMN IF NOT EXISTS finalizado_em timestamptz;

-- === Leads capturados (B2B) ===
CREATE TABLE public.manager_scraper_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  busca_id uuid REFERENCES public.manager_scraper_buscas(id) ON DELETE SET NULL,
  sistema_id uuid REFERENCES public.manager_sistemas(id) ON DELETE SET NULL,
  google_place_id text,
  nome text NOT NULL,
  categoria text,
  cidade text,
  uf text,
  endereco text,
  telefone text,
  whatsapp text,
  email text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  google_maps_url text,
  avaliacao numeric(3,2),
  total_avaliacoes int,
  horario_funcionamento jsonb,
  score int NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT 'google_places',
  hash_dedupe text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  enviado_crm boolean NOT NULL DEFAULT false,
  lead_id uuid REFERENCES public.manager_leads(id) ON DELETE SET NULL,
  capturado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hash_dedupe)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_scraper_leads TO authenticated;
GRANT ALL ON public.manager_scraper_leads TO service_role;
ALTER TABLE public.manager_scraper_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins gerenciam leads capturados" ON public.manager_scraper_leads
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_scraper_leads_updated BEFORE UPDATE ON public.manager_scraper_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_scraper_leads_busca ON public.manager_scraper_leads(busca_id);
CREATE INDEX idx_scraper_leads_sistema ON public.manager_scraper_leads(sistema_id);
CREATE INDEX idx_scraper_leads_uf ON public.manager_scraper_leads(uf);
CREATE INDEX idx_scraper_leads_place ON public.manager_scraper_leads(google_place_id) WHERE google_place_id IS NOT NULL;

-- === Seed: nichos iniciais ===
INSERT INTO public.manager_scraper_nichos (sistema_id, slug, nome, termos, ordem)
SELECT s.id, 'clinicas-consultorios', 'Clínicas e Consultórios',
  ARRAY['clínica médica','consultório médico','clínica odontológica','consultório odontológico','clínica de fisioterapia','clínica de psicologia','clínica de estética','clínica veterinária','clínica de dermatologia','clínica pediátrica'], 1
FROM public.manager_sistemas s WHERE s.slug = 'amt-clinic'
ON CONFLICT DO NOTHING;

INSERT INTO public.manager_scraper_nichos (sistema_id, slug, nome, termos, ordem)
SELECT s.id, 'restaurantes-bares', 'Restaurantes e Bares',
  ARRAY['restaurante','pizzaria','hamburgueria','churrascaria','restaurante japonês','restaurante italiano','restaurante árabe','restaurante vegano','self service','bar','lanchonete','cafeteria','padaria','sorveteria','marmitaria','food truck'], 1
FROM public.manager_sistemas s WHERE s.slug = 'amt-restaurant'
ON CONFLICT DO NOTHING;

-- === Seed: 27 capitais brasileiras ===
INSERT INTO public.manager_scraper_cidades (uf, nome, populacao, latitude, longitude) VALUES
  ('AC','Rio Branco',419452,-9.97499,-67.8243),
  ('AL','Maceió',1031597,-9.66599,-35.7350),
  ('AP','Macapá',522357,0.03889,-51.0664),
  ('AM','Manaus',2255903,-3.11903,-60.0217),
  ('BA','Salvador',2418005,-12.9714,-38.5014),
  ('CE','Fortaleza',2703391,-3.71722,-38.5433),
  ('DF','Brasília',3094325,-15.7801,-47.9292),
  ('ES','Vitória',369534,-20.3155,-40.3128),
  ('GO','Goiânia',1555626,-16.6869,-49.2648),
  ('MA','São Luís',1115932,-2.53073,-44.3068),
  ('MT','Cuiabá',650912,-15.6014,-56.0979),
  ('MS','Campo Grande',916001,-20.4697,-54.6201),
  ('MG','Belo Horizonte',2521564,-19.9167,-43.9345),
  ('PA','Belém',1506420,-1.45583,-48.5039),
  ('PB','João Pessoa',833932,-7.11532,-34.8641),
  ('PR','Curitiba',1963726,-25.4284,-49.2733),
  ('PE','Recife',1653461,-8.05389,-34.8811),
  ('PI','Teresina',866300,-5.08917,-42.8016),
  ('RJ','Rio de Janeiro',6775561,-22.9068,-43.1729),
  ('RN','Natal',896708,-5.79448,-35.2110),
  ('RS','Porto Alegre',1492530,-30.0346,-51.2177),
  ('RO','Porto Velho',548952,-8.76194,-63.9004),
  ('RR','Boa Vista',437432,2.81972,-60.6733),
  ('SC','Florianópolis',537213,-27.5949,-48.5482),
  ('SP','São Paulo',12325232,-23.5505,-46.6333),
  ('SE','Aracaju',664908,-10.9472,-37.0731),
  ('TO','Palmas',313349,-10.1837,-48.3336)
ON CONFLICT (uf, nome) DO NOTHING;
