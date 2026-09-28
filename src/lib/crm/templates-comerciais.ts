/**
 * Biblioteca de templates comerciais AMT Sistemas.
 * Cobre 3 sistemas × 4 canais × 14 etapas do funil.
 * Variáveis suportadas: {{empresa}} {{nome}} {{cidade}} {{estado}} {{sistema}} {{responsavel}} {{url}}
 */

export type SistemaId = "hotel" | "restaurant" | "clinic" | "vet" | "outro";
export type CanalId = "whatsapp" | "instagram" | "facebook" | "email";
export type EtapaId =
  | "primeiro_contato"
  | "apresentacao"
  | "demonstracao"
  | "teste_gratuito"
  | "followup_1"
  | "followup_2"
  | "followup_3"
  | "cliente_interessado"
  | "sem_resposta"
  | "reativacao"
  | "envio_proposta"
  | "agendamento"
  | "pos_demonstracao"
  | "fechamento";

export const CANAIS: Array<{ id: CanalId; label: string; icon: string }> = [
  { id: "whatsapp", label: "WhatsApp", icon: "📱" },
  { id: "instagram", label: "Instagram Direct", icon: "📷" },
  { id: "facebook", label: "Facebook Messenger", icon: "📘" },
  { id: "email", label: "Email", icon: "📧" },
];

export const ETAPAS: Array<{ id: EtapaId; label: string; ordem: number }> = [
  { id: "primeiro_contato", label: "Primeiro contato", ordem: 1 },
  { id: "apresentacao", label: "Apresentação", ordem: 2 },
  { id: "demonstracao", label: "Demonstração", ordem: 3 },
  { id: "teste_gratuito", label: "Convite para teste gratuito", ordem: 4 },
  { id: "followup_1", label: "Follow-up 1", ordem: 5 },
  { id: "followup_2", label: "Follow-up 2", ordem: 6 },
  { id: "followup_3", label: "Follow-up 3", ordem: 7 },
  { id: "cliente_interessado", label: "Cliente interessado", ordem: 8 },
  { id: "sem_resposta", label: "Cliente sem resposta", ordem: 9 },
  { id: "reativacao", label: "Reativação", ordem: 10 },
  { id: "envio_proposta", label: "Envio de proposta", ordem: 11 },
  { id: "agendamento", label: "Agendamento", ordem: 12 },
  { id: "pos_demonstracao", label: "Pós demonstração", ordem: 13 },
  { id: "fechamento", label: "Fechamento", ordem: 14 },
];

export const SISTEMAS: Record<SistemaId, {
  id: SistemaId;
  nome: string;
  url: string;
  cta_principal: string;
  cta_secundario: string;
  beneficios: string[];
  cor: string;
  emoji: string;
}> = {
  hotel: {
    id: "hotel",
    nome: "AMT Hotel",
    url: "https://hotel.amtsistemas.com.br",
    cta_principal: "Agendar demonstração",
    cta_secundario: "Iniciar teste gratuito",
    cor: "indigo",
    emoji: "🏨",
    beneficios: [
      "Reservas organizadas com mapa de UHs em tempo real",
      "Check-in e Check-out em segundos",
      "Controle financeiro e dashboard gerencial",
      "Channel Manager (Booking, Airbnb, Expedia)",
      "Sistema 100% online, sem instalação",
      "14 dias grátis, sem cartão de crédito",
    ],
  },
  restaurant: {
    id: "restaurant",
    nome: "AMT Restaurant",
    url: "https://restaurant.amtsistemas.com.br",
    cta_principal: "Conhecer o sistema",
    cta_secundario: "Testar gratuitamente",
    cor: "amber",
    emoji: "🍽️",
    beneficios: [
      "Comanda, mesa, delivery e cozinha em tempo real",
      "Controle de estoque e caixa integrados",
      "Redução de desperdícios e erros de pedido",
      "Atendimento mais rápido, giro de mesa maior",
      "Sistema em nuvem, roda no tablet ou celular",
      "14 dias grátis, sem cartão de crédito",
    ],
  },
  clinic: {
    id: "clinic",
    nome: "AMT Clinic",
    url: "https://clinic.amtsistemas.com.br",
    cta_principal: "Agendar demonstração",
    cta_secundario: "Solicitar acesso de teste",
    cor: "sky",
    emoji: "🩺",
    beneficios: [
      "Agenda por profissional e prontuário eletrônico",
      "Cadastro de pacientes, exames e consultas",
      "Controle financeiro e caixa integrados",
      "Segurança de dados (LGPD) e sistema em nuvem",
      "Dashboard e relatórios em tempo real",
      "14 dias grátis, sem cartão de crédito",
    ],
  },
  vet: {
    id: "vet",
    nome: "AMT Vet",
    url: "https://amtsistemas.com.br",
    cta_principal: "Entrar na lista de espera",
    cta_secundario: "Falar com especialista",
    cor: "emerald",
    emoji: "🐾",
    beneficios: [
      "Agenda de consultas e cirurgias por veterinário",
      "Prontuário eletrônico do pet (anamnese, vacinas, exames)",
      "Cadastro de tutores e histórico completo do animal",
      "Controle de estoque de medicamentos e vacinas",
      "Financeiro, caixa e cobrança integrados",
      "Em desenvolvimento — entre na lista de espera",
    ],
  },
  outro: {
    id: "outro",
    nome: "AMT Sistemas",
    url: "https://amtsistemas.com.br",
    cta_principal: "Conhecer soluções",
    cta_secundario: "Falar com especialista",
    cor: "slate",
    emoji: "⚙️",
    beneficios: [
      "Soluções verticais para clínicas, restaurantes e hotéis",
      "Gestão, vendas, cobrança e financeiro em um só lugar",
      "Sistema 100% online",
      "14 dias grátis",
    ],
  },
};

/* ═══════════ Classificador ═══════════ */

const REGEX_HOTEL = /\b(hot[ée]l\w*|pousad\w*|hostel|resort|motel|inn|flat|apart[- ]?hotel|hospedag\w*|chal[ée]s?|guest ?house|bed ?& ?breakfast|b&b)\b/i;
const REGEX_RESTAURANT = /\b(restaur\w*|pizzaria|pizza|hamburgu\w*|burger|lanchonete|lanches|bar|pub|choppe?ria|cafeter\w*|caf[ée]|padar\w*|confeitar\w*|doceria|sorveter\w*|a[çc]a[ií]|churrasc\w*|espeta\w*|sushi|temaker\w*|japon[êe]s|comida|food|bistr[ôo]|cantina|tratt?oria|marmit\w*|delivery|self ?service|buffet|quitand\w*)\b/i;
// Veterinária vem ANTES de clínica humana para não ser capturada como saúde humana.
const REGEX_VET = /\b(veterin\w*|vet\b|pet ?shop|pet ?clinic\w*|clin[ií]ca\s+veterin\w*|hospital\s+veterin\w*|animal|animais|c[ãa]es?|c[ãa]ozinho|gatos?|felin\w*|canin\w*|zoot[ée]cn\w*|agropecu\w*|silvestres?|equin\w*)\b/i;
const REGEX_CLINIC = /\b(cl[ií]nic\w*|consult[óo]rio|hospital|m[ée]dic\w*|dr\.?|dra\.?|doutor\w*|odonto\w*|dentist\w*|dermato\w*|pediatr\w*|ginecolog\w*|psic[óo]log\w*|psiquiatr\w*|fisioterap\w*|nutric\w*|est[ée]tica|spa|sa[úu]de|laborat[óo]rio|radiolog\w*|ortoped\w*|oftalmo\w*)\b/i;

export function classificarSistema(lead: {
  nome?: string | null;
  empresa?: string | null;
  origem?: string | null;
  observacoes?: string | null;
}): SistemaId {
  const txt = `${lead.empresa ?? ""} ${lead.nome ?? ""} ${lead.origem ?? ""} ${lead.observacoes ?? ""}`.toLowerCase();
  if (REGEX_HOTEL.test(txt)) return "hotel";
  if (REGEX_RESTAURANT.test(txt)) return "restaurant";
  // Vet vem antes de Clinic — "clínica veterinária" deve virar vet, não clinic.
  if (REGEX_VET.test(txt)) return "vet";
  if (REGEX_CLINIC.test(txt)) return "clinic";
  return "outro";
}

/* ═══════════ Variáveis ═══════════ */

export type LeadVars = {
  empresa?: string | null;
  nome?: string | null;
  cidade?: string | null;
  estado?: string | null;
  responsavel?: string | null;
};

export function preencherVariaveis(texto: string, sistema: SistemaId, lead?: LeadVars): string {
  const s = SISTEMAS[sistema];
  const empresa = lead?.empresa || lead?.nome || "sua operação";
  const primeiroNome = (lead?.nome || "").split(" ")[0] || "tudo bem";
  const map: Record<string, string> = {
    empresa,
    nome: primeiroNome,
    cidade: lead?.cidade || "sua cidade",
    estado: lead?.estado || "",
    sistema: s.nome,
    url: s.url,
    responsavel: lead?.responsavel || primeiroNome,
    cta: s.cta_principal,
    cta_secundario: s.cta_secundario,
  };
  return texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => map[k] ?? `{{${k}}}`);
}

/* ═══════════ Templates ═══════════ */

export type Template = {
  id: string;
  sistema: SistemaId;
  etapa: EtapaId;
  canal: CanalId;
  titulo: string;
  assunto?: string;
  texto: string;
  favorito?: boolean;
};

/* Blocos reutilizáveis por sistema */
const B = {
  hotel: {
    curto: "reservas, mapa de quartos, check-in/out e financeiro em um só lugar",
    demo: "reservas organizadas, tarifas dinâmicas, Channel Manager e dashboard em tempo real",
    valor: "reduzir erros na recepção e ganhar produtividade no dia a dia",
  },
  restaurant: {
    curto: "comanda, mesa, delivery, cozinha e caixa integrados",
    demo: "comanda no tablet, KDS na cozinha, delivery próprio, estoque e caixa em tempo real",
    valor: "acelerar o giro de mesa e reduzir desperdícios",
  },
  clinic: {
    curto: "agenda, prontuário, financeiro e caixa em um só sistema",
    demo: "agenda por profissional, prontuário eletrônico, exames, financeiro e dashboard",
    valor: "reduzir faltas e agilizar o atendimento",
  },
  vet: {
    curto: "agenda veterinária, prontuário do pet, estoque e financeiro em um só lugar",
    demo: "agenda por veterinário, prontuário eletrônico do pet, vacinas, exames, estoque e financeiro",
    valor: "organizar o atendimento e reduzir faltas de consultas e retornos",
  },
  outro: {
    curto: "gestão, vendas e cobrança em um só sistema",
    demo: "módulos verticais para o seu segmento",
    valor: "organizar a operação e ganhar tempo",
  },
} as const;

function tpl(sistema: SistemaId, etapa: EtapaId, canal: CanalId, idx: number, titulo: string, texto: string, assunto?: string): Template {
  return {
    id: `${sistema}_${etapa}_${canal}_${idx}`,
    sistema, etapa, canal, titulo, texto, assunto,
  };
}

function buildForSistema(sistema: SistemaId): Template[] {
  const b = B[sistema];
  const s = SISTEMAS[sistema];
  const list: Template[] = [];

  const push = (etapa: EtapaId, canal: CanalId, titulo: string, texto: string, assunto?: string) => {
    list.push(tpl(sistema, etapa, canal, list.length + 1, titulo, texto, assunto));
  };

  /* ─── PRIMEIRO CONTATO ─── */
  push("primeiro_contato", "whatsapp", "Abertura direta",
    `Olá, equipe do {{empresa}}! Sou da AMT Sistemas. Ajudamos negócios do seu segmento com o *{{sistema}}* — ${b.curto}. Faz sentido conversarmos 10 min esta semana? {{url}}`);
  push("primeiro_contato", "whatsapp", "Abertura consultiva",
    `Oi, tudo bem? Aqui é da AMT Sistemas. Vi o {{empresa}} em {{cidade}} e queria te apresentar o {{sistema}}, que ajuda a ${b.valor}. Posso te mandar um resumo rápido?`);
  push("primeiro_contato", "instagram", "Direct informal",
    `Oi, equipe do {{empresa}}! 👋 Vi por aqui e adorei o trabalho de vocês. Sou da AMT Sistemas — temos o *{{sistema}}* pensado justamente pra ${b.valor}. Posso te mandar um vídeo curto?`);
  push("primeiro_contato", "facebook", "Messenger educado",
    `Olá! Sou da AMT Sistemas. O {{sistema}} centraliza ${b.curto} em uma plataforma simples. Faria sentido eu te mandar mais informações sobre o {{empresa}}?`);
  push("primeiro_contato", "email", "Apresentação formal",
    `Olá,\n\nSou da AMT Sistemas. Desenvolvemos o {{sistema}} — sistema completo com ${b.demo}, pensado para ajudar operações como a do {{empresa}} a ${b.valor}.\n\nPosso te enviar um material rápido de 2 páginas? Se preferir, agendo 15 minutos para uma demonstração ao vivo.\n\nAbraço,\nEquipe AMT Sistemas\n{{url}}`,
    `{{empresa}}: ${b.curto}`);

  /* ─── APRESENTAÇÃO ─── */
  push("apresentacao", "whatsapp", "Apresentação enxuta",
    `{{nome}}, resumindo o *{{sistema}}* em 3 pontos:\n• ${s.beneficios[0]}\n• ${s.beneficios[1]}\n• ${s.beneficios[2]}\n\nQuer ver aplicado ao {{empresa}}? {{cta}}: {{url}}`);
  push("apresentacao", "instagram", "Apresentação visual",
    `Oi, {{nome}}! 🚀 O *{{sistema}}* resolve pra quem gerencia negócios como o {{empresa}}:\n\n✅ ${s.beneficios[0]}\n✅ ${s.beneficios[1]}\n✅ ${s.beneficios[2]}\n\nPosso te mostrar uma demo?`);
  push("apresentacao", "facebook", "Apresentação Messenger",
    `Oi, {{nome}}! O {{sistema}} foi feito para ${b.valor}. Principais recursos:\n• ${s.beneficios[0]}\n• ${s.beneficios[1]}\n• ${s.beneficios[3]}\n\nQuer conhecer? {{url}}`);
  push("apresentacao", "email", "Apresentação completa",
    `Olá, {{nome}},\n\nConforme conversamos, segue uma visão geral do *{{sistema}}*:\n\n• ${s.beneficios[0]}\n• ${s.beneficios[1]}\n• ${s.beneficios[2]}\n• ${s.beneficios[3]}\n• ${s.beneficios[4]}\n\nTudo isso em uma plataforma 100% online, com 14 dias de teste gratuito.\n\nPodemos agendar 20 minutos de demonstração aplicada ao {{empresa}}?\n\nAbraço,\nEquipe AMT Sistemas`,
    `Como o {{sistema}} funciona no {{empresa}}`);

  /* ─── DEMONSTRAÇÃO ─── */
  push("demonstracao", "whatsapp", "Convite direto para demo",
    `{{nome}}, consigo te mostrar o *{{sistema}}* em 20 min via chamada — te levo por ${b.demo}. Quais horários funcionam pra você amanhã ou depois?`);
  push("demonstracao", "instagram", "Convite descontraído",
    `{{nome}}, bora marcar uma demo rápida do *{{sistema}}*? 20 min pelo Google Meet, te mostro tudo aplicado ao {{empresa}}. Que dia é bom essa semana?`);
  push("demonstracao", "facebook", "Convite Messenger",
    `{{nome}}, posso agendar uma demonstração de 20 min do {{sistema}} para o {{empresa}}? Me passa dois horários que funcionem melhor.`);
  push("demonstracao", "email", "Convite demonstração",
    `Olá, {{nome}},\n\nGostaria de te mostrar o *{{sistema}}* em uma sessão de 20 minutos via Google Meet, com foco no cenário do {{empresa}}.\n\nDurante a demonstração cobrimos:\n• ${b.demo}\n• Como implantar em poucos dias\n• Suporte e integração\n\nMe envie 2 ou 3 horários que funcionem melhor esta semana.\n\nAbraço.`,
    `Demonstração {{sistema}} para {{empresa}}`);

  /* ─── TESTE GRATUITO ─── */
  push("teste_gratuito", "whatsapp", "Convite trial 14 dias",
    `{{nome}}, se preferir você mesmo explorar, te libero 14 dias grátis do *{{sistema}}* — sem cartão de crédito. Posso criar o acesso do {{empresa}} agora?`);
  push("teste_gratuito", "instagram", "Trial descontraído",
    `{{nome}}, quer testar o *{{sistema}}* antes de qualquer coisa? 14 dias grátis, sem cartão. Me passa um e-mail que já libero pra vocês do {{empresa}}. 🚀`);
  push("teste_gratuito", "facebook", "Trial Messenger",
    `{{nome}}, temos 14 dias grátis do {{sistema}} sem compromisso. Posso liberar o acesso para o {{empresa}}?`);
  push("teste_gratuito", "email", "Trial oficial",
    `Olá, {{nome}},\n\nComo combinamos, você pode testar o *{{sistema}}* por 14 dias sem custo e sem cartão de crédito.\n\nCrie a conta em: {{url}}\n\nAssim que o acesso do {{empresa}} estiver ativo, agendamos 15 minutos de onboarding para você aproveitar melhor.\n\nQualquer dúvida, é só responder este e-mail.\n\nAbraço.`,
    `Seu acesso de teste ao {{sistema}} — 14 dias grátis`);

  /* ─── FOLLOW-UPS ─── */
  push("followup_1", "whatsapp", "Follow-up curto",
    `{{nome}}, tudo bem? Só passando pra saber se conseguiu dar uma olhada no {{sistema}}. Consigo tirar dúvidas por aqui mesmo. 👍`);
  push("followup_1", "email", "Follow-up 3 dias",
    `Olá, {{nome}},\n\nPassando para saber se você teve chance de olhar o material do {{sistema}}. Fico à disposição para tirar dúvidas ou agendar uma demonstração ao vivo.\n\nAbraço.`,
    `Follow-up: {{sistema}} para {{empresa}}`);
  push("followup_1", "instagram", "Follow-up direct",
    `Oi {{nome}}! Só passando pra checar se conseguiu ver o vídeo do {{sistema}}. Qualquer dúvida, tô por aqui. 😉`);
  push("followup_1", "facebook", "Follow-up Messenger",
    `Oi {{nome}}, teve chance de olhar o material do {{sistema}}? Se precisar, mando de novo.`);

  push("followup_2", "whatsapp", "Follow-up com valor",
    `{{nome}}, pensando no {{empresa}}: com o *{{sistema}}* você consegue ${b.valor} desde a primeira semana. Consegue 10 min pra eu te mostrar rápido?`);
  push("followup_2", "email", "Follow-up 7 dias",
    `Olá, {{nome}},\n\nEntendo que a rotina está corrida. Só queria reforçar que o *{{sistema}}* pode ajudar o {{empresa}} a ${b.valor} em poucos dias.\n\nConsegue me indicar um horário nesta semana ou na próxima?\n\nAbraço.`,
    `{{empresa}}: ainda dá tempo de organizar com o {{sistema}}`);
  push("followup_2", "instagram", "Follow-up valor",
    `{{nome}}, o pessoal que testou o *{{sistema}}* conseguiu ${b.valor} nos primeiros dias. Faz sentido a gente conversar rapidinho?`);
  push("followup_2", "facebook", "Follow-up valor",
    `{{nome}}, o {{sistema}} costuma trazer resultado já na primeira semana. Faria sentido conversarmos?`);

  push("followup_3", "whatsapp", "Follow-up última tentativa",
    `{{nome}}, essa é minha última mensagem por aqui pra não te encher 🙂 Se fizer sentido pra {{empresa}} no futuro, é só me chamar. Sucesso!`);
  push("followup_3", "email", "Follow-up encerramento",
    `Olá, {{nome}},\n\nEste é meu último contato por agora — não quero atrapalhar sua rotina. Se em algum momento fizer sentido conhecer o {{sistema}}, é só responder este e-mail.\n\nSucesso com o {{empresa}}!\n\nAbraço.`,
    `Fico à disposição — {{sistema}}`);
  push("followup_3", "instagram", "Encerramento gentil",
    `{{nome}}, sem problemas se agora não for o momento. Fico por aqui se quiser retomar depois. 🙌`);
  push("followup_3", "facebook", "Encerramento gentil",
    `{{nome}}, sem problemas — deixo por aqui. Se quiser retomar, me chama. 👋`);

  /* ─── CLIENTE INTERESSADO ─── */
  push("cliente_interessado", "whatsapp", "Interessado — próximos passos",
    `Que ótimo, {{nome}}! Pra dar sequência no {{sistema}} pro {{empresa}}, me confirma:\n\n1) Melhor horário pra demo\n2) Quantos usuários vão utilizar\n3) Se quer começar pelo teste grátis ou já ver proposta`);
  push("cliente_interessado", "email", "Interessado — checklist",
    `Olá, {{nome}},\n\nQue bom saber do interesse! Para agilizar, me confirma por favor:\n\n• Melhor horário para uma sessão de demonstração\n• Quantidade estimada de usuários\n• Preferência entre teste gratuito de 14 dias ou proposta comercial\n\nAssim que responder, já organizo tudo do lado da AMT Sistemas.\n\nAbraço.`,
    `Próximos passos — {{sistema}} para {{empresa}}`);
  push("cliente_interessado", "instagram", "Interessado direct",
    `Aeee {{nome}}! 🎉 Bora dar sequência. Me manda seu e-mail e um horário bom pra demo do {{sistema}}?`);
  push("cliente_interessado", "facebook", "Interessado Messenger",
    `Que bom, {{nome}}! Me confirma horário pra demo e melhor e-mail que já organizo tudo. 🙌`);

  /* ─── SEM RESPOSTA ─── */
  push("sem_resposta", "whatsapp", "Sem resposta educado",
    `{{nome}}, imagino que a rotina esteja corrida no {{empresa}}. Prefere que eu volte a te chamar em duas semanas? 🙏`);
  push("sem_resposta", "email", "Sem resposta profissional",
    `Olá, {{nome}},\n\nNão obtive retorno nas últimas mensagens — tudo certo aí no {{empresa}}? Se preferir que eu volte a falar em outro momento, me avisa quando é melhor.\n\nAbraço.`,
    `Consigo te ajudar em outro momento? — {{sistema}}`);
  push("sem_resposta", "instagram", "Sem resposta direct",
    `{{nome}}, tá tudo bem por aí? Se preferir que eu volte outra hora, só me avisar. 🙏`);
  push("sem_resposta", "facebook", "Sem resposta Messenger",
    `{{nome}}, tudo bem? Se agora não é a melhor hora, me diz quando eu posso voltar a falar.`);

  /* ─── REATIVAÇÃO ─── */
  push("reativacao", "whatsapp", "Reativação novidade",
    `{{nome}}, faz um tempo! Trouxemos novidades no *{{sistema}}* que podem fazer sentido pro {{empresa}}. Posso te mostrar em 10 min?`);
  push("reativacao", "email", "Reativação novidades",
    `Olá, {{nome}},\n\nHá alguns meses conversamos sobre o {{sistema}}. De lá pra cá lançamos várias novidades que fazem muito sentido para o {{empresa}}.\n\nGostaria de retomar a conversa? Consigo te mostrar as novidades em 15 minutos.\n\nAbraço.`,
    `Novidades no {{sistema}} para o {{empresa}}`);
  push("reativacao", "instagram", "Reativação direct",
    `Oi {{nome}}! 👋 Faz um tempo. O *{{sistema}}* tá cheio de novidade — bora dar uma olhada juntos?`);
  push("reativacao", "facebook", "Reativação Messenger",
    `Oi {{nome}}! Faz um tempo — trouxe novidades no {{sistema}}. Bora conversar?`);

  /* ─── ENVIO DE PROPOSTA ─── */
  push("envio_proposta", "whatsapp", "Proposta enviada",
    `{{nome}}, acabei de te enviar a proposta comercial do *{{sistema}}* pro {{empresa}} por e-mail. Qualquer ajuste ou dúvida me chama por aqui. 👍`);
  push("envio_proposta", "email", "Proposta oficial",
    `Olá, {{nome}},\n\nSegue em anexo a proposta comercial do *{{sistema}}* para o {{empresa}}, com escopo, prazo de implantação e investimento.\n\nQualquer ajuste, é só responder este e-mail ou me chamar no WhatsApp.\n\nAbraço.`,
    `Proposta comercial — {{sistema}} para {{empresa}}`);
  push("envio_proposta", "instagram", "Proposta direct",
    `{{nome}}, enviei a proposta do {{sistema}} pro seu e-mail. Qualquer coisa me chama por aqui. 🙌`);
  push("envio_proposta", "facebook", "Proposta Messenger",
    `{{nome}}, mandei a proposta do {{sistema}} pro seu e-mail. Fico no aguardo. 🙏`);

  /* ─── AGENDAMENTO ─── */
  push("agendamento", "whatsapp", "Confirmação de horário",
    `{{nome}}, confirmando nossa demo do *{{sistema}}* — te envio o link do Google Meet 10 min antes. Combinado?`);
  push("agendamento", "email", "Confirmação de reunião",
    `Olá, {{nome}},\n\nApenas confirmando nossa reunião para demonstração do *{{sistema}}*. Enviarei o link do Google Meet minutos antes do horário combinado.\n\nSe precisar remarcar, é só me avisar.\n\nAbraço.`,
    `Confirmação: demonstração {{sistema}}`);
  push("agendamento", "instagram", "Agendamento direct",
    `{{nome}}, tá agendado! Te mando o link do Meet 10 min antes. 😉`);
  push("agendamento", "facebook", "Agendamento Messenger",
    `{{nome}}, agendado — te mando o link antes. Combinado!`);

  /* ─── PÓS DEMONSTRAÇÃO ─── */
  push("pos_demonstracao", "whatsapp", "Pós demo — obrigado",
    `{{nome}}, obrigado pelo tempo hoje! Como combinamos, te envio agora o resumo do *{{sistema}}* e um acesso de teste pro {{empresa}}. Bora dar sequência? 🚀`);
  push("pos_demonstracao", "email", "Pós demo — próximos passos",
    `Olá, {{nome}},\n\nObrigado pela conversa de hoje. Segue o resumo do que foi visto no *{{sistema}}*, além do acesso de teste para o {{empresa}}.\n\nPróximos passos sugeridos:\n1) Explorar o ambiente de teste\n2) Alinhar dúvidas comigo por WhatsApp\n3) Fechar formato de contratação\n\nFico no aguardo do seu retorno.\n\nAbraço.`,
    `Resumo da demonstração — {{sistema}}`);
  push("pos_demonstracao", "instagram", "Pós demo direct",
    `{{nome}}, valeu demais pelo bate-papo! Te mandei o resumo por e-mail. Qualquer dúvida me chama por aqui. 🙌`);
  push("pos_demonstracao", "facebook", "Pós demo Messenger",
    `{{nome}}, valeu pela reunião! Segue tudo no seu e-mail. Qualquer coisa me chama.`);

  /* ─── FECHAMENTO ─── */
  push("fechamento", "whatsapp", "Fechamento consultivo",
    `{{nome}}, chegou a hora! 🎉 Bora ativar o *{{sistema}}* pro {{empresa}}? Me confirma que sigo com o contrato pra assinatura.`);
  push("fechamento", "email", "Fechamento profissional",
    `Olá, {{nome}},\n\nCom base em tudo que conversamos, entendo que o *{{sistema}}* faz muito sentido para o {{empresa}}.\n\nPara ativar, preciso apenas da sua confirmação por este e-mail. Em seguida envio o contrato e o cronograma de implantação.\n\nFico no aguardo!\n\nAbraço.`,
    `Vamos ativar o {{sistema}} para o {{empresa}}?`);
  push("fechamento", "instagram", "Fechamento direct",
    `{{nome}}, bora fechar? 🚀 Confirma por aqui que já disparo o contrato. 🙌`);
  push("fechamento", "facebook", "Fechamento Messenger",
    `{{nome}}, bora ativar o {{sistema}}? Confirma que sigo com o contrato.`);

  return list;
}

let _cache: Template[] | null = null;
export function todosTemplates(): Template[] {
  if (_cache) return _cache;
  _cache = [
    ...buildForSistema("hotel"),
    ...buildForSistema("restaurant"),
    ...buildForSistema("clinic"),
    ...buildForSistema("vet"),
  ];
  return _cache;
}

export function filtrarTemplates(opts: {
  sistema?: SistemaId;
  etapa?: EtapaId;
  canal?: CanalId;
}): Template[] {
  return todosTemplates().filter((t) =>
    (!opts.sistema || t.sistema === opts.sistema) &&
    (!opts.etapa || t.etapa === opts.etapa) &&
    (!opts.canal || t.canal === opts.canal),
  );
}

/* ═══════════ Insights de personalização (heurística leve) ═══════════ */

export type LeadContexto = LeadVars & {
  origem?: string | null;
  observacoes?: string | null;
  score?: number | null;
  created_at?: string | null;
};

export function insightsLead(lead: LeadContexto): string[] {
  const out: string[] = [];
  const txt = `${lead.observacoes ?? ""} ${lead.origem ?? ""}`.toLowerCase();
  if (!lead.empresa) out.push("Sem nome de empresa — priorizar mensagem consultiva");
  if (lead.cidade) out.push(`Presença em ${lead.cidade}${lead.estado ? "/" + lead.estado : ""}`);
  if (/website|site|www\./.test(txt)) out.push("Possui website — abordagem mais formal");
  else out.push("Sem website detectado — reforçar presença digital como valor");
  if (/instagram|@|ig/.test(txt)) out.push("Instagram ativo — considerar abordagem por Direct");
  if (typeof lead.score === "number") {
    if (lead.score >= 75) out.push("Score alto — priorizar contato imediato");
    else if (lead.score >= 50) out.push("Score bom — nutrir com apresentação enxuta");
    else out.push("Score baixo — sequência longa de nutrição");
  }
  if (lead.created_at) {
    const dias = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
    if (dias >= 30) out.push(`Sem interação há ${dias} dias — considerar reativação`);
    else if (dias <= 2) out.push("Lead recém captado — abordagem quente");
  }
  return out;
}
