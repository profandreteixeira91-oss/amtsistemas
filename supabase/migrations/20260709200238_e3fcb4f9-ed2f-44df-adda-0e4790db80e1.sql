
insert into manager_sistemas (nome, slug, descricao, url, cor, ativo)
values ('AMT Vet','amt-vet','Gestão completa para clínicas e hospitais veterinários','https://vet.amtsistemas.com.br','#14b8a6',true)
on conflict (slug) do update set ativo=true, url=excluded.url;

with s as (select id from manager_sistemas where slug='amt-vet')
insert into manager_planos (sistema_id, slug, nome, descricao, preco_mensal, destaque, ordem, ativo, recursos)
select s.id, v.slug, v.nome, v.descricao, v.preco_mensal, v.destaque, v.ordem, true, v.recursos::jsonb
from s, (values
  ('starter','Starter','Para clínicas veterinárias começando a digitalizar',189.00,false,1,'["Prontuário eletrônico do pet","Agenda multiprofissional","Cadastro de tutores e pets","Lembretes por WhatsApp","Suporte por email"]'),
  ('pro','Pro','Ideal para clínicas em crescimento e hospitais veterinários',449.00,true,2,'["Tudo do Starter","Controle de vacinas e vermífugos automatizado","Estoque de medicamentos e PDV pet shop","Financeiro completo integrado","Relatórios avançados","Suporte prioritário"]'),
  ('enterprise','Enterprise','Redes veterinárias e operações multi-unidade',0.00,false,3,'["Tudo do Pro","Unidades ilimitadas","Integrações personalizadas","SSO e permissões avançadas","Gerente de conta dedicado"]')
) as v(slug,nome,descricao,preco_mensal,destaque,ordem,recursos)
on conflict (sistema_id, slug) do nothing;
