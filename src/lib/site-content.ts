// Textos do site público usados em mais de um lugar: na página, no JSON-LD (src/lib/seo.ts) e no
// /llms.txt (src/routes/llms[.]txt.ts). Mudou aqui, muda em todos.

export type Faq = { q: string; a: string };

/* Home (amtsistemas.com.br) */

export const SERVICOS: Array<{ titulo: string; texto: string }> = [
  {
    titulo: "Sistemas White Label",
    texto:
      "Plataformas completas com a sua marca, para vender aos seus clientes ou organizar a sua operação.",
  },
  {
    titulo: "Websites",
    texto: "Sites institucionais e landing pages rápidos, responsivos e prontos para o Google.",
  },
  {
    titulo: "Softwares para Windows",
    texto: "Programas instalados no computador, com instalador próprio e atualização automática.",
  },
  {
    titulo: "Aplicativos Android e iOS",
    texto: "Apps publicados na Google Play e na App Store, integrados ao seu sistema.",
  },
  {
    titulo: "Lojas virtuais",
    texto: "E-commerce com catálogo, carrinho, frete, pagamento on-line e gestão de pedidos.",
  },
  {
    titulo: "Automações e IA",
    texto: "WhatsApp automático, cobranças, integrações e Inteligência Artificial no dia a dia.",
  },
];

export const HOME_FAQ: Faq[] = [
  {
    q: "O que é um sistema White Label?",
    a: "É um sistema desenvolvido pela AMT e entregue com a identidade da sua empresa: nome, logotipo, cores, domínio e experiência de uso. Para os seus clientes, a solução é sua.",
  },
  {
    q: "O sistema é criado para o meu negócio?",
    a: "Sim. O desenvolvimento parte dos seus processos e regras, não de um modelo fechado. Você define os módulos e as permissões no planejamento.",
  },
  {
    q: "Vocês também fazem sites e aplicativos?",
    a: "Sim. Além de sistemas, desenvolvemos sites, softwares para Windows, aplicativos Android e iOS, lojas virtuais e automações, separados ou integrados ao seu sistema.",
  },
  {
    q: "Quanto custa um projeto?",
    a: "Depende do escopo: módulos, integrações, número de usuários e nível de personalização. Depois do diagnóstico, enviamos uma proposta com escopo, prazo e investimento.",
  },
  {
    q: "Vocês cuidam da manutenção depois da entrega?",
    a: "Sim. Hospedagem, atualizações, suporte e evolução do sistema são combinados junto com o escopo, conforme a necessidade de cada cliente.",
  },
];

/* AMT OptiOne (amtsistemas.com.br/optione) */

export const OPTIONE_RECURSOS: Array<{ titulo: string; texto: string }> = [
  {
    titulo: "Vendas e PDV",
    texto:
      "Leitor de código de barras, pagamentos múltiplos com troco, sinal, crediário e orçamentos que viram venda.",
  },
  {
    titulo: "Receitas OD/OE",
    texto:
      "Esférico, cilíndrico, eixo, adição, DNP e altura, com alertas de digitação e histórico por cliente.",
  },
  {
    titulo: "Pedidos e laboratório",
    texto:
      "Quadro por etapa, do envio à entrega, com prazos, custos, ocorrências e alerta de atraso.",
  },
  {
    titulo: "Estoque e compras",
    texto:
      "Armações, lentes, lentes de contato e acessórios, com estoque mínimo, histórico e pedidos de compra.",
  },
  {
    titulo: "Financeiro",
    texto:
      "Contas a pagar e a receber, parcelas do crediário e relatórios em PDF com a identidade da ótica.",
  },
  {
    titulo: "Relacionamento",
    texto:
      "Pós-venda, revisão de receita, aniversariantes e clientes inativos, com mensagem pronta para WhatsApp.",
  },
  {
    titulo: "Documentos com a sua marca",
    texto:
      "Ordem de serviço, orçamento e comprovante em PDF com a logo da ótica, prontos para imprimir ou enviar.",
  },
  {
    titulo: "Equipe e acessos",
    texto:
      "Um login para cada pessoa e só os módulos que ela precisa. Vendas registradas por vendedor.",
  },
  {
    titulo: "Indicadores",
    texto:
      "Faturamento, lucro efetivo, ticket médio, conversão de orçamentos e produtos mais rentáveis.",
  },
];

export const OPTIONE_FAQ: Faq[] = [
  {
    q: "O teste grátis tem algum custo ou pede cartão?",
    a: "Não. São 14 dias com todos os recursos do plano escolhido, sem cartão de crédito e sem compromisso.",
  },
  {
    q: "O que acontece quando o teste termina?",
    a: "Os seus dados continuam guardados. Para seguir registrando vendas e cadastros, basta contratar um plano com a nossa equipe. Enquanto isso, o sistema fica disponível para consulta.",
  },
  {
    q: "O que é a chave de acesso?",
    a: "É um código no formato AMT-XXXX-XXXX-XXXX-XXXX, exibido ao concluir o cadastro. Cada computador da ótica pede a chave uma única vez; depois, a equipe entra só com usuário e senha. Se perder a chave, o dono gera uma nova em amtsistemas.com.br/optione/nova-chave.",
  },
  {
    q: "Em quais computadores o AMT OptiOne funciona?",
    a: "Em Windows 10 ou 11, com conexão à internet. Os dados ficam na nuvem, com cópia de segurança, e cada ótica enxerga apenas os próprios dados.",
  },
  {
    q: "Posso cadastrar a minha equipe?",
    a: "Sim. O dono cria um login para cada pessoa, escolhe os módulos que ela pode usar e a equipe entra com o código da ótica, o nome de usuário e a senha.",
  },
  {
    q: "Funciona com leitor de código de barras e impressora?",
    a: "Sim. Leitores USB ou sem fio que funcionam como teclado são compatíveis sem driver, e os documentos saem em PDF prontos para qualquer impressora.",
  },
];
