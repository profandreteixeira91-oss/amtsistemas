-- Catálogo do site (/admin › Sistemas e /api/public/planos/amt-dojo-manager): planos do AMT Dojo Manager.
--
-- Os planos Essencial, Profissional e Premium foram criados no Dojo em 2026-11-09 (saas-plans.ts e
-- dojo_plan_price() no banco do Dojo), mas o catálogo do site não tinha nenhum plano do Dojo. Valores, limites e
-- itens iguais aos de src/lib/dojo/saas-plans.ts no amtdojomanager. Sem preço anual (o Dojo cobra só mensal).
-- Idempotente: atualiza se o plano já existir.

insert into public.manager_planos
  (sistema_id, slug, nome, descricao, preco_mensal, preco_anual, recursos, limites, destaque, recomendado, badge, ordem, ativo)
select s.id, p.slug, p.nome, p.descricao, p.preco_mensal, 0, p.recursos, p.limites, p.destaque, false, p.badge, p.ordem, true
from public.manager_sistemas s
cross join (values
  ('essencial', 'Essencial', 'O dia a dia da academia organizado', 99.90::numeric,
   '["Até 100 alunos ativos", "Alunos, matrículas e planos de mensalidade", "Agenda, turmas e check-in", "Financeiro completo e AMT Pay", "Modalidades, faixas e graduações", "App do Aluno com push e carteirinha", "Quadro de avisos e vendas avulsas", "AMT Store integrada", "1 unidade · 2 usuários do sistema"]'::jsonb,
   '{"alunos": 100, "unidades": 1, "usuarios": 2}'::jsonb, false, null::text, 1),
  ('profissional', 'Profissional', 'Ensino, equipe e competição', 159.90::numeric,
   '["Tudo do Essencial", "Até 300 alunos ativos", "Avaliações e certificados", "Planos de aula e biblioteca de vídeos", "Ranking e competições", "Central de contratos", "Equipe: folha e escalas", "WhatsApp da academia", "1 unidade · 5 usuários do sistema"]'::jsonb,
   '{"alunos": 300, "unidades": 1, "usuarios": 5}'::jsonb, true, 'Mais escolhido', 2),
  ('premium', 'Premium', 'Para redes e academias em expansão', 229.90::numeric,
   '["Tudo do Profissional", "Alunos ilimitados", "Unidades, filiais e rede de afiliados", "Benefícios corporativos (Gympass, TotalPass)", "Usuários do sistema ilimitados"]'::jsonb,
   '{"alunos": null, "unidades": null, "usuarios": null}'::jsonb, false, null::text, 3)
) as p(slug, nome, descricao, preco_mensal, recursos, limites, destaque, badge, ordem)
where s.slug = 'amt-dojo-manager'
on conflict (sistema_id, slug) do update set
  nome = excluded.nome, descricao = excluded.descricao, preco_mensal = excluded.preco_mensal,
  recursos = excluded.recursos, limites = excluded.limites, destaque = excluded.destaque,
  badge = excluded.badge, ordem = excluded.ordem, ativo = true, updated_at = now();
