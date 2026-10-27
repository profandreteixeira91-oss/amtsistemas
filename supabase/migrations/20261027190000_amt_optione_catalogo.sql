-- AMT OptiOne (sistema de gestão para óticas) no catálogo comercial: /optione lê sistema e planos daqui
-- (editáveis em /amt-admin/sistemas e /amt-admin/planos). Os códigos dos planos (slug) são os mesmos do
-- sistema (essencial, profissional, rede): o cadastro pelo site usa esse código como plano do teste.
-- Idempotente: não altera nada que já exista.

insert into public.manager_sistemas
    (nome, slug, descricao, url, logo_url, cor, ativo, trial_dias, pitch_comercial, suporte_whatsapp, suporte_email,
     versao, configuracoes)
values (
    'AMT OptiOne',
    'amt-optione',
    'Sistema de gestão para óticas: vendas e PDV, receitas, pedidos de laboratório, estoque, financeiro e relacionamento.',
    'https://amtsistemas.com.br/optione',
    'https://amtsistemas.com.br/optione/logo-amt-optione.png',
    '#1A9E8F',
    true,
    14,
    'Sua ótica organizada do balcão ao laboratório. Teste grátis por 14 dias, sem cartão.',
    '5511999738440',
    'contato@amtsistemas.com.br',
    '1.0.0',
    jsonb_build_object(
        'hero_titulo', 'Sua ótica organizada do balcão ao laboratório.',
        'hero_subtitulo', 'Vendas e PDV, receitas, laboratório, estoque, financeiro e relacionamento em um só sistema.',
        'cta_primario', 'Teste grátis por 14 dias',
        'cta_secundario', 'Falar com a AMT'
    )
)
on conflict (slug) do nothing;

insert into public.manager_planos
    (sistema_id, slug, nome, descricao, preco_mensal, preco_anual, recursos, limites, ordem, destaque, badge, ativo)
select s.id, p.slug, p.nome, p.descricao, p.preco_mensal, p.preco_anual, p.recursos, p.limites, p.ordem, p.destaque,
       p.badge, true
from public.manager_sistemas s
cross join (values
    ('essencial', 'Essencial', 'Para a ótica que está começando a organizar a operação.', 149.00, 1490.00,
     '["Até 3 usuários", "Até 2 computadores", "Vendas, PDV, receitas e laboratório", "Estoque, financeiro e indicadores"]'::jsonb,
     '{"usuarios": 3, "computadores": 2, "whatsapp_automatico": false}'::jsonb, 1, false, null::text),
    ('profissional', 'Profissional', 'A operação completa, com WhatsApp automático para os clientes.', 249.00, 2490.00,
     '["Até 10 usuários", "Até 5 computadores", "Tudo do Essencial", "WhatsApp automático: pedidos, PDFs e pós-venda"]'::jsonb,
     '{"usuarios": 10, "computadores": 5, "whatsapp_automatico": true}'::jsonb, 2, true, 'Mais escolhido'),
    ('rede', 'Rede', 'Para óticas com equipe grande ou várias frentes de atendimento.', 399.00, 3990.00,
     '["Usuários ilimitados", "Computadores ilimitados", "Tudo do Profissional", "Atendimento prioritário"]'::jsonb,
     '{"usuarios": null, "computadores": null, "whatsapp_automatico": true}'::jsonb, 3, false, null::text)
) as p(slug, nome, descricao, preco_mensal, preco_anual, recursos, limites, ordem, destaque, badge)
where s.slug = 'amt-optione'
on conflict (sistema_id, slug) do nothing;
