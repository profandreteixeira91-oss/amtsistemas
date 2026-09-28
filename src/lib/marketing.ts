/**
 * Dados marketing centralizados: planos, benefícios, FAQ, depoimentos.
 * Valores marcados como PLACEHOLDER — substituir quando cliente definir.
 */

export type PlanoId = "starter" | "professional" | "enterprise";

export type Plano = {
  id: PlanoId;
  nome: string;
  descricao: string;
  precoMensal: number | null; // null = sob consulta
  precoAnualMensal: number | null; // valor equivalente mensal ao pagar anual
  destaque?: boolean;
  cta: string;
  recursos: string[];
  limites: {
    unidades: string;
    usuarios: string;
    comandas: string;
    suporte: string;
  };
};

// PLACEHOLDER pricing — substituir por valores finais
export const planos: Plano[] = [
  {
    id: "starter",
    nome: "Starter",
    descricao: "Para restaurantes iniciando a digitalização",
    precoMensal: 149,
    precoAnualMensal: 119,
    cta: "Começar Teste Grátis",
    recursos: [
      "Mesas e Comandas",
      "Cardápio digital",
      "Estoque básico",
      "Dashboard operacional",
      "Suporte por e-mail",
    ],
    limites: {
      unidades: "1 unidade",
      usuarios: "Até 5 usuários",
      comandas: "Comandas ilimitadas",
      suporte: "E-mail",
    },
  },
  {
    id: "professional",
    nome: "Professional",
    descricao: "O ideal para restaurantes em crescimento",
    precoMensal: 349,
    precoAnualMensal: 279,
    destaque: true,
    cta: "Assinar Professional",
    recursos: [
      "Tudo do Starter",
      "Ficha técnica e CMV automático",
      "Fornecedores + comparativo de compras",
      "Cozinha (KDS) e delivery",
      "Financeiro completo + DRE",
      "Relatórios avançados",
      "IA · previsões e insights",
      "Suporte prioritário",
    ],
    limites: {
      unidades: "Até 3 unidades",
      usuarios: "Até 20 usuários",
      comandas: "Comandas ilimitadas",
      suporte: "Chat + e-mail",
    },
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    descricao: "Redes e operações multi-unidades",
    precoMensal: null,
    precoAnualMensal: null,
    cta: "Falar com Vendas",
    recursos: [
      "Tudo do Professional",
      "Unidades ilimitadas",
      "Consolidação multi-unidade",
      "Integrações personalizadas (ERP, iFood, PDVs)",
      "SSO e permissões avançadas",
      "SLA dedicado",
      "Onboarding dedicado",
    ],
    limites: {
      unidades: "Ilimitadas",
      usuarios: "Ilimitados",
      comandas: "Ilimitadas",
      suporte: "Gerente de conta dedicado",
    },
  },
];

export const beneficios = [
  { icon: "UtensilsCrossed", titulo: "Controle de Mesas", texto: "Layout visual do salão, ocupação em tempo real e transferências rápidas." },
  { icon: "ClipboardList", titulo: "Comandas", texto: "Abertura, divisão e fechamento em segundos, integrados à cozinha." },
  { icon: "BookOpen", titulo: "Cardápio Digital", texto: "QR code na mesa, categorias, fotos e modificadores." },
  { icon: "Package", titulo: "Estoque", texto: "Entrada, saída, perdas e alertas de mínimo automáticos." },
  { icon: "ShoppingCart", titulo: "Compras", texto: "Comparativo de fornecedores e pedidos com um clique." },
  { icon: "Wallet", titulo: "Financeiro", texto: "Contas a pagar/receber, conciliação e DRE gerencial." },
  { icon: "Truck", titulo: "Delivery", texto: "Pedidos externos integrados ao KDS e ao estoque." },
  { icon: "LayoutDashboard", titulo: "Dashboard", texto: "KPIs em tempo real: ticket médio, ocupação, CMV, top produtos." },
  { icon: "BookMarked", titulo: "Ficha Técnica", texto: "Receitas, porções, perdas e custo por prato preciso." },
  { icon: "Percent", titulo: "CMV Automático", texto: "Custo de mercadoria vendida recalculado a cada movimento." },
  { icon: "Sparkles", titulo: "Inteligência Artificial", texto: "Previsões de demanda, curva ABC e insights acionáveis." },
  { icon: "Building2", titulo: "Multiunidade", texto: "Uma conta, várias unidades, consolidação e comparativos." },
] as const;

export const passos = [
  { n: "1", titulo: "Crie sua conta", texto: "Cadastro em 2 minutos, sem cartão de crédito." },
  { n: "2", titulo: "Escolha seu plano", texto: "Comece pelo Trial de 14 dias no plano que fizer sentido." },
  { n: "3", titulo: "Configure seu restaurante", texto: "Importe cardápio, mesas e estoque com nosso onboarding." },
  { n: "4", titulo: "Comece a vender", texto: "Time operando, insights fluindo, gestão sob controle." },
] as const;

export const comparativo = {
  colunas: ["AMT Restaurant", "Planilhas", "Sistema antigo"],
  linhas: [
    { rec: "Tempo real em toda a operação", v: [true, false, "Parcial"] },
    { rec: "Integração cozinha ↔ salão ↔ delivery", v: [true, false, "Parcial"] },
    { rec: "Ficha técnica com CMV automático", v: [true, false, false] },
    { rec: "Comparativo de fornecedores", v: [true, false, false] },
    { rec: "Multiunidade consolidada", v: [true, false, "Parcial"] },
    { rec: "IA para previsões e insights", v: [true, false, false] },
    { rec: "Suporte especializado em restaurantes", v: [true, false, "Parcial"] },
    { rec: "Atualizações automáticas", v: [true, false, false] },
  ] as { rec: string; v: (boolean | string)[] }[],
};

export const depoimentos = [
  {
    nome: "Marina Alves",
    cargo: "Proprietária",
    empresa: "Cantina do Chef",
    foto: "https://i.pravatar.cc/120?img=47",
    rating: 5,
    texto:
      "Reduzimos o CMV em 4 pontos no primeiro trimestre. A ficha técnica automática mudou nossa vida.",
  },
  {
    nome: "Rodrigo Menezes",
    cargo: "Gerente Operacional",
    empresa: "Grupo Sabor & Cia",
    foto: "https://i.pravatar.cc/120?img=15",
    rating: 5,
    texto:
      "Consolidamos 4 unidades num único painel. O que antes levava dias, hoje sai em minutos.",
  },
  {
    nome: "Camila Duarte",
    cargo: "Chef Executiva",
    empresa: "Bistrô Terra",
    foto: "https://i.pravatar.cc/120?img=32",
    rating: 5,
    texto:
      "A cozinha finalmente conversa com o salão. Sem papel, sem retrabalho, sem grito de expedição.",
  },
];

export const faq = [
  {
    q: "Preciso de cartão de crédito para o teste grátis?",
    a: "Não. Você tem 14 dias grátis sem informar cartão. Ao final, escolhe o plano que melhor se encaixa.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Trabalhamos com criptografia em trânsito e em repouso, backups automáticos e conformidade com a LGPD.",
  },
  {
    q: "Consigo migrar meu cardápio e estoque atuais?",
    a: "Sim. Fazemos importação via planilha e o time de onboarding acompanha a virada de sistema.",
  },
  {
    q: "Funciona em quais dispositivos?",
    a: "Roda em qualquer navegador moderno: PC, notebook, tablet e smartphone. Para KDS recomendamos tablets ou monitores.",
  },
  {
    q: "Posso ter mais de uma unidade?",
    a: "Sim. Os planos Professional e Enterprise suportam múltiplas unidades com consolidação de indicadores.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Todos os planos têm suporte por e-mail. Professional inclui chat prioritário. Enterprise tem gerente de conta dedicado.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem multa, sem fidelidade. Você exporta seus dados a qualquer momento.",
  },
];
