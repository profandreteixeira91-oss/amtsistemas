import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { iaAnalisarLead, iaGerarMensagem, iaListarProvidersDisponiveis } from "@/lib/crm/ai-service.functions";
import { iaScoreLead, iaCopiloto, iaEnfileirarMensagem } from "@/lib/crm/scoring.functions";
import { inscreverLeadEmSequencia } from "@/lib/crm/sequencias.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, MessageCircle, Search, Mail, Workflow, Bot, Flame, Send,
  Phone, Copy, ExternalLink, Cpu,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/leads")({
  head: () => ({ meta: [{ title: "Leads · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LeadsPage,
});

type Lead = {
  id: string; nome: string; email: string | null; telefone: string | null;
  empresa: string | null; status: string; origem: string | null; created_at: string;
  observacoes: string | null; score: number | null; score_motivo: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  lovable_ai: "Lovable AI", groq: "Groq", openrouter: "OpenRouter",
  gemini: "Gemini", mistral: "Mistral", cohere: "Cohere", huggingface: "HuggingFace",
  cloudflare_ai: "Cloudflare AI", ollama: "Ollama", together_ai: "Together AI",
  openai: "OpenAI", claude: "Claude",
};

/* ═════════ Helpers de contato ═════════ */

function digits(v: string | null | undefined) {
  return (v ?? "").replace(/\D/g, "");
}

function waLink(tel: string | null, texto?: string) {
  const d = digits(tel);
  if (!d) return null;
  // adiciona 55 se parecer BR sem DDI
  const numero = d.length <= 11 ? `55${d}` : d;
  const t = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${numero}${t}`;
}

function mailLink(email: string | null, assunto?: string, corpo?: string) {
  if (!email) return null;
  const params: string[] = [];
  if (assunto) params.push(`subject=${encodeURIComponent(assunto)}`);
  if (corpo) params.push(`body=${encodeURIComponent(corpo)}`);
  return `mailto:${email}${params.length ? `?${params.join("&")}` : ""}`;
}

function telLink(tel: string | null) {
  const d = digits(tel);
  return d ? `tel:${d}` : null;
}

async function copiar(texto: string, msg = "Copiado!") {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(msg);
  } catch {
    toast.error("Não consegui copiar");
  }
}

/* ═════════ Classificador inteligente de segmento ═════════ */

type Segmento = "clinic" | "vet" | "restaurant" | "hotel" | "outro";

const SEGMENTOS: Array<{
  id: Segmento;
  label: string;
  sistema: string;
  url: string;
  keywords: RegExp;
  status?: "ativo" | "em-desenvolvimento";
}> = [
  {
    // Veterinária DEVE ser avaliada antes de clínica humana,
    // senão "clínica veterinária" cai em clinic.
    id: "vet",
    label: "Clínicas Veterinárias & Pet",
    sistema: "AMT Vet",
    url: "https://amtsistemas.com.br",
    status: "em-desenvolvimento",
    keywords: /\b(veterin\w*|vet\b|pet ?shop|pet ?clinic\w*|clin[ií]ca\s+veterin\w*|hospital\s+veterin\w*|animais?|c[ãa]es?|c[ãa]ozinho|gatos?|felin\w*|canin\w*|zoot[ée]cn\w*|agropecu\w*|silvestres?|equin\w*|petshop)\b/i,
  },
  {
    id: "clinic",
    label: "Clínicas Humanas & Saúde",
    sistema: "AMT Clinic",
    url: "https://clinic.amtsistemas.com.br",
    keywords: /\b(cl[ií]nic\w*|consult[óo]rio|hospital|m[ée]dic\w*|dr\.?|dra\.?|doutor\w*|odonto\w*|dentist\w*|dermato\w*|pediatr\w*|ginecolog\w*|psic[óo]log\w*|psiquiatr\w*|fisioterap\w*|nutric\w*|est[ée]tica|spa|sa[úu]de|laborat[óo]rio|radiolog\w*|ortoped\w*|oftalmo\w*)\b/i,
  },
  {
    id: "restaurant",
    label: "Restaurantes & Alimentação",
    sistema: "AMT Restaurant",
    url: "https://restaurant.amtsistemas.com.br",
    keywords: /\b(restaur\w*|pizzaria|pizza|hamburgu\w*|burger|lanchonete|lanches|bar|pub|choppe?ria|cafeter\w*|caf[ée]|padar\w*|confeitar\w*|doceria|sorveter\w*|a[çc]a[ií]|churrasc\w*|espeta\w*|sushi|temaker\w*|japon[êe]s|comida|food|bistr[ôo]|cantina|tratt?oria|marmit\w*|delivery|self ?service|buffet|quitand\w*)\b/i,
  },
  {
    id: "hotel",
    label: "Hotéis & Hospedagem",
    sistema: "AMT Hotel",
    url: "https://hotel.amtsistemas.com.br",
    keywords: /\b(hot[ée]l\w*|pousad\w*|hostel|resort|motel|inn|flat|apart[- ]?hotel|hospedag\w*|chal[ée]s?|guest ?house|bed ?& ?breakfast|b&b)\b/i,
  },
];

function classificarSegmento(lead: Pick<Lead, "nome" | "empresa" | "origem">): Segmento {
  const txt = `${lead.empresa ?? ""} ${lead.nome ?? ""} ${lead.origem ?? ""}`.toLowerCase();
  for (const s of SEGMENTOS) if (s.keywords.test(txt)) return s.id;
  return "outro";
}

function infoSegmento(id: Segmento) {
  return SEGMENTOS.find((s) => s.id === id);
}

function segmentoBadge(id: Segmento) {
  const info = infoSegmento(id);
  const cls =
    id === "vet" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
    id === "clinic" ? "border-sky-200 bg-sky-50 text-sky-700" :
    id === "restaurant" ? "border-amber-200 bg-amber-50 text-amber-800" :
    id === "hotel" ? "border-indigo-200 bg-indigo-50 text-indigo-700" :
    "border-muted bg-muted/40 text-muted-foreground";
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{info?.sistema ?? "Outro"}</Badge>;
}

/* Mensagens pré-estabelecidas por sistema */
function templatePorSegmento(seg: Segmento, canal: "whatsapp" | "email", lead: Lead): { assunto?: string; texto: string } {
  const nome = (lead.nome || "").split(" ")[0] || "tudo bem";
  const empresa = lead.empresa || lead.nome || "sua operação";
  const info = infoSegmento(seg);
  const sistema = info?.sistema ?? "AMT Sistemas";
  const url = info?.url ?? "https://amtsistemas.com.br";

  const corpos: Record<Segmento, { wa: string; email: { assunto: string; corpo: string } }> = {
    clinic: {
      wa: `Olá, ${nome}! Sou da AMT Sistemas. Ajudamos clínicas como a ${empresa} a organizar agenda, prontuário e cobrança em um só lugar com o *${sistema}*. Posso te mostrar em 15 min como reduzir faltas e agilizar o atendimento? ${url}`,
      email: {
        assunto: `${empresa}: agenda, prontuário e cobrança em um só sistema`,
        corpo: `Olá, ${nome}.\n\nSou da AMT Sistemas. O ${sistema} foi feito para clínicas e consultórios organizarem agenda, prontuário eletrônico, teleconsulta e cobrança automática.\n\nPosso te mostrar em 15 minutos como aplicar na ${empresa}? Conheça: ${url}\n\nAbraço.`,
      },
    },
    vet: {
      wa: `Olá, ${nome}! Sou da AMT Sistemas. Estamos desenvolvendo o *${sistema}*, feito sob medida para clínicas e hospitais veterinários como a ${empresa} — agenda por veterinário, prontuário do pet, vacinas, estoque e financeiro em um só lugar. Posso te colocar na lista de espera e te mostrar uma prévia em 15 min? ${url}`,
      email: {
        assunto: `${empresa}: gestão completa para clínica veterinária (${sistema} em desenvolvimento)`,
        corpo: `Olá, ${nome}.\n\nSou da AMT Sistemas. Estamos desenvolvendo o ${sistema}, um sistema pensado para clínicas e hospitais veterinários: agenda por profissional, prontuário eletrônico do pet, controle de vacinas, exames, estoque de medicamentos e financeiro integrado.\n\nPosso te colocar na lista de espera e te mostrar uma prévia em 15 minutos, aplicada à realidade da ${empresa}? ${url}\n\nAbraço.`,
      },
    },
    restaurant: {
      wa: `Oi, ${nome}! Sou da AMT Sistemas. O *${sistema}* controla comanda, mesa, delivery e cozinha do ${empresa} em tempo real, direto do celular ou tablet. Consegue 15 min pra eu te mostrar? ${url}`,
      email: {
        assunto: `${empresa}: comanda, delivery e cozinha em um só app`,
        corpo: `Olá, ${nome}.\n\nSou da AMT Sistemas. O ${sistema} integra PDV, comanda, mesas, delivery e cozinha em tempo real — reduz erro de pedido e acelera o giro de mesa.\n\nPosso te mostrar em 15 minutos aplicado ao ${empresa}? ${url}\n\nAbraço.`,
      },
    },
    hotel: {
      wa: `Olá, ${nome}! Sou da AMT Sistemas. O *${sistema}* gerencia reservas, mapa de quartos, tarifas dinâmicas e Channel Manager do ${empresa} sem planilha. Posso te mostrar em 15 min? ${url}`,
      email: {
        assunto: `${empresa}: reservas, tarifas e Channel Manager unificados`,
        corpo: `Olá, ${nome}.\n\nSou da AMT Sistemas. O ${sistema} centraliza reservas, mapa de UHs, tarifas dinâmicas e Channel Manager (Booking, Airbnb, Expedia) — direto no navegador.\n\nPosso agendar 15 minutos para te mostrar aplicado ao ${empresa}? ${url}\n\nAbraço.`,
      },
    },
    outro: {
      wa: `Olá, ${nome}! Sou da AMT Sistemas. Ajudamos negócios como o ${empresa} a organizar gestão, vendas e cobrança em um só sistema. Consegue 15 min pra eu te mostrar? ${url}`,
      email: {
        assunto: `${empresa}: gestão, vendas e cobrança em um só sistema`,
        corpo: `Olá, ${nome}.\n\nSou da AMT Sistemas. Temos soluções verticais para clínicas, restaurantes e hotéis — e uma plataforma comum de gestão, vendas e cobrança.\n\nPosso te mostrar em 15 minutos qual módulo faz mais sentido para o ${empresa}? ${url}\n\nAbraço.`,
      },
    },
  };

  if (canal === "whatsapp") return { texto: corpos[seg].wa };
  return { assunto: corpos[seg].email.assunto, texto: corpos[seg].email.corpo };
}

/* ═════════ Componente ═════════ */

function LeadsPage() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<Lead | null>(null);
  const [iaOutput, setIaOutput] = useState<string>("");
  const [iaLoading, setIaLoading] = useState(false);
  const [copiloto, setCopiloto] = useState<any>(null);
  const [seqSelecionada, setSeqSelecionada] = useState<string>("");
  const [providerTexto, setProviderTexto] = useState<string>("auto");
  const [ultimoCanal, setUltimoCanal] = useState<"whatsapp" | "email" | null>(null);
  const [segFiltro, setSegFiltro] = useState<Segmento | "todos">("todos");


  const analisar = useServerFn(iaAnalisarLead);
  const gerarMsg = useServerFn(iaGerarMensagem);
  const scoreFn = useServerFn(iaScoreLead);
  const copilotoFn = useServerFn(iaCopiloto);
  const enfileirarFn = useServerFn(iaEnfileirarMensagem);
  const inscrever = useServerFn(inscreverLeadEmSequencia);
  const listarProviders = useServerFn(iaListarProvidersDisponiveis);

  const providersQ = useQuery({
    queryKey: ["ia-providers-texto"],
    queryFn: () => listarProviders({}),
  });

  const seqQ = useQuery({
    queryKey: ["crm_seq_ativas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_sequencias").select("id, nome").eq("ativo", true);
      if (error) throw error;
      return data as Array<{ id: string; nome: string }>;
    },
  });

  const enroll = useMutation({
    mutationFn: async ({ lead_id, sequencia_id }: { lead_id: string; sequencia_id: string }) =>
      inscrever({ data: { lead_id, sequencia_id } }),
    onSuccess: () => { toast.success("Lead inscrito na sequência"); qc.invalidateQueries({ queryKey: ["crm_enrollments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const q = useQuery({
    queryKey: ["crm_leads", busca],
    queryFn: async () => {
      let query = supabase.from("manager_leads").select("*").order("created_at", { ascending: false }).limit(200);
      if (busca.trim()) query = query.or(`nome.ilike.%${busca}%,empresa.ilike.%${busca}%,email.ilike.%${busca}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const providerArg = () => (providerTexto === "auto" ? undefined : providerTexto);

  async function runAnalise(lead: Lead) {
    setIaLoading(true); setIaOutput(""); setUltimoCanal(null);
    try {
      const r = await analisar({ data: { lead_id: lead.id, provider_preferido: providerArg() } });
      setIaOutput(r.content);
      toast.success(`Análise via ${PROVIDER_LABEL[r.provider_usado] ?? r.provider_usado}`);
    }
    catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }

  async function runMensagem(lead: Lead, canal: "whatsapp" | "email") {
    setIaLoading(true); setIaOutput(""); setUltimoCanal(canal);
    try {
      const seg = classificarSegmento(lead);
      const info = infoSegmento(seg);
      const r = await gerarMsg({ data: {
        canal,
        empresa: lead.empresa || lead.nome,
        categoria: info ? `${info.label} — oferecer ${info.sistema} (${info.url})` : (lead.origem || ""),
        tom: "consultivo",
        objetivo: `agendar demonstração do ${info?.sistema ?? "sistema AMT"}`,
        cta: "agendar 15min",
        provider_preferido: providerArg(),
      }});
      setIaOutput(r.content);
      toast.success(`${canal === "email" ? "Email" : "WhatsApp"} via ${PROVIDER_LABEL[r.provider_usado] ?? r.provider_usado}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }

  async function runScore(lead: Lead) {
    setIaLoading(true);
    try {
      const r = await scoreFn({ data: { lead_id: lead.id } });
      toast.success(`Score atualizado: ${r.score} (${r.categoria})`);
      qc.invalidateQueries({ queryKey: ["crm_leads"] });
      setAberto({ ...lead, score: r.score, score_motivo: r.motivo });
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }

  async function runCopiloto(lead: Lead) {
    setIaLoading(true); setCopiloto(null);
    try {
      const r = await copilotoFn({ data: { lead_id: lead.id } });
      setCopiloto((r as any).briefing ?? { raw: (r as any).raw });
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }

  async function enviarMensagemCopiloto(lead: Lead) {
    const m = copiloto?.mensagem_pronta;
    if (!m?.texto) return;
    try {
      await enfileirarFn({ data: { lead_id: lead.id, canal: m.canal, conteudo: m.texto, assunto: m.assunto } });
      toast.success("Mensagem enfileirada para envio");
    } catch (e) { toast.error((e as Error).message); }
  }

  function scoreBadge(score: number | null) {
    if (score == null) return null;
    const variant = score >= 75 ? "destructive" : score >= 50 ? "default" : "secondary";
    return <Badge variant={variant as any} className="gap-1 text-[10px]"><Flame className="h-2.5 w-2.5" />{score}</Badge>;
  }

  /* Ações de contato rápido na linha do lead */
  function ContatoRapido({ lead, compact }: { lead: Lead; compact?: boolean }) {
    const wa = waLink(lead.telefone);
    const em = mailLink(lead.email);
    const tel = telLink(lead.telefone);
    const size = compact ? "sm" : "default";
    return (
      <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {wa ? (
          <Button asChild size={size as any} variant="outline" className="h-7 gap-1 px-2 text-xs text-emerald-700 hover:text-emerald-800 border-emerald-200">
            <a href={wa} target="_blank" rel="noreferrer" title="Abrir WhatsApp">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </Button>
        ) : null}
        {em ? (
          <Button asChild size={size as any} variant="outline" className="h-7 gap-1 px-2 text-xs">
            <a href={em} title="Enviar email">
              <Mail className="h-3.5 w-3.5" /> Email
            </a>
          </Button>
        ) : null}
        {tel ? (
          <Button asChild size={size as any} variant="outline" className="h-7 gap-1 px-2 text-xs">
            <a href={tel} title="Ligar">
              <Phone className="h-3.5 w-3.5" /> Ligar
            </a>
          </Button>
        ) : null}
        {lead.telefone ? (
          <Button size={size as any} variant="ghost" className="h-7 px-1.5" title="Copiar telefone"
            onClick={() => copiar(lead.telefone!, "Telefone copiado")}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Contate direto pelos botões ou abra para usar a IA.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por nome, empresa ou email…" className="pl-7" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {(() => {
        const leadsClassificados = (q.data ?? []).map((l) => ({ ...l, _seg: classificarSegmento(l) }));
        const contadores: Record<Segmento | "todos", number> = {
          todos: leadsClassificados.length,
          clinic: 0, vet: 0, restaurant: 0, hotel: 0, outro: 0,
        };
        for (const l of leadsClassificados) contadores[l._seg]++;
        const visiveis = segFiltro === "todos" ? leadsClassificados : leadsClassificados.filter((l) => l._seg === segFiltro);

        const tabs: Array<{ id: Segmento | "todos"; label: string }> = [
          { id: "todos", label: "Todos" },
          { id: "clinic", label: "Clínicas Humanas" },
          { id: "vet", label: "Clínicas Veterinárias" },
          { id: "restaurant", label: "Restaurantes" },
          { id: "hotel", label: "Hotéis" },
          { id: "outro", label: "Outros" },
        ];

        return (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {tabs.map((t) => (
                <Button key={t.id} size="sm" variant={segFiltro === t.id ? "default" : "outline"}
                  className="h-8 gap-1.5 text-xs" onClick={() => setSegFiltro(t.id)}>
                  {t.label}
                  <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px]">{contadores[t.id]}</Badge>
                </Button>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                Filtro automático pelo nome/empresa do lead.
              </span>
            </div>

            <Card>
              <CardContent className="p-0">
                {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
                  visiveis.length === 0 ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                      {segFiltro === "todos"
                        ? <>Nenhum lead ainda. Use o <strong>Lead Scraper</strong> para importar do Google Maps.</>
                        : <>Nenhum lead classificado como <strong>{infoSegmento(segFiltro as Segmento)?.label}</strong>.</>}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {visiveis.map((l) => (
                        <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/40">
                          <Link to="/crm/leads/$id" params={{ id: l.id }} className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{l.empresa || l.nome}</span>
                              <Badge variant="secondary" className="text-[10px]">{l.status}</Badge>
                              {segmentoBadge(l._seg)}
                              {scoreBadge(l.score)}
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                              {[l.nome !== l.empresa ? l.nome : null, l.email, l.telefone].filter(Boolean).join(" · ")}
                            </div>
                          </Link>
                          <ContatoRapido lead={l} compact />
                          {(() => {
                            const tpl = templatePorSegmento(l._seg, "whatsapp", l);
                            const wa = waLink(l.telefone, tpl.texto);
                            const em = mailLink(l.email, templatePorSegmento(l._seg, "email", l).assunto, templatePorSegmento(l._seg, "email", l).texto);
                            const info = infoSegmento(l._seg);
                            return (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {wa && (
                                  <Button asChild size="sm" variant="secondary" className="h-7 gap-1 px-2 text-xs"
                                    title={`Mensagem pronta ${info?.sistema}`}>
                                    <a href={wa} target="_blank" rel="noreferrer">
                                      <Send className="h-3.5 w-3.5" /> {info?.sistema ?? "AMT"}
                                    </a>
                                  </Button>
                                )}
                                {!wa && em && (
                                  <Button asChild size="sm" variant="secondary" className="h-7 gap-1 px-2 text-xs"
                                    title={`Email pronto ${info?.sistema}`}>
                                    <a href={em}>
                                      <Send className="h-3.5 w-3.5" /> {info?.sistema ?? "AMT"}
                                    </a>
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                          <Button size="sm" variant="ghost" asChild>
                            <Link to="/crm/leads/$id" params={{ id: l.id }}>Abrir</Link>
                          </Button>
                          <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </>
        );
      })()}


      <Dialog open={!!aberto} onOpenChange={(o) => { if (!o) { setAberto(null); setIaOutput(""); setCopiloto(null); setUltimoCanal(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {aberto?.empresa || aberto?.nome}
              {aberto && segmentoBadge(classificarSegmento(aberto))}
              {scoreBadge(aberto?.score ?? null)}
            </DialogTitle>
            <DialogDescription>{[aberto?.email, aberto?.telefone].filter(Boolean).join(" · ") || "Sem dados de contato"}</DialogDescription>
          </DialogHeader>

          {/* Contato rápido no topo do dialog */}
          {aberto && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-2">
              <ContatoRapido lead={aberto} />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                IA:
                <Select value={providerTexto} onValueChange={setProviderTexto}>
                  <SelectTrigger className="h-7 w-[190px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (fallback)</SelectItem>
                    {(providersQ.data?.texto ?? []).map((p: any) => (
                      <SelectItem key={p.tipo} value={p.tipo}>
                        {PROVIDER_LABEL[p.tipo] ?? p.tipo} — {p.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Tabs defaultValue="copiloto" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="copiloto"><Bot className="mr-1 h-3.5 w-3.5" /> Copiloto</TabsTrigger>
              <TabsTrigger value="acoes"><Sparkles className="mr-1 h-3.5 w-3.5" /> Ações IA</TabsTrigger>
              <TabsTrigger value="sequencia"><Workflow className="mr-1 h-3.5 w-3.5" /> Sequência</TabsTrigger>
            </TabsList>

            <TabsContent value="copiloto" className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => aberto && runCopiloto(aberto)} disabled={iaLoading}>
                  <Bot className="mr-2 h-4 w-4" /> Gerar briefing IA
                </Button>
                <Button size="sm" variant="outline" onClick={() => aberto && runScore(aberto)} disabled={iaLoading}>
                  <Flame className="mr-2 h-4 w-4" /> Recalcular score
                </Button>
              </div>
              {aberto?.score_motivo && (
                <div className="rounded-md border bg-muted/30 p-2 text-xs">
                  <span className="font-medium">Motivo do score:</span> {aberto.score_motivo}
                </div>
              )}
              {iaLoading && <Skeleton className="h-40" />}
              {copiloto?.resumo && (
                <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
                  <div><span className="font-semibold">Resumo:</span> {copiloto.resumo}</div>
                  <div><span className="font-semibold">Próxima ação:</span> {copiloto.proxima_acao} <span className="text-xs text-muted-foreground">({copiloto.quando})</span></div>
                  {copiloto.sistema_recomendado && <div><span className="font-semibold">Sistema:</span> {copiloto.sistema_recomendado}</div>}
                  {copiloto.objecoes_provaveis?.length > 0 && (
                    <div>
                      <div className="font-semibold">Objeções prováveis:</div>
                      <ul className="ml-4 list-disc space-y-1 text-xs">
                        {copiloto.objecoes_provaveis.map((o: string, i: number) => (
                          <li key={i}>{o} <span className="text-muted-foreground">→ {copiloto.rebatidas?.[i] ?? "—"}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {copiloto.mensagem_pronta?.texto && (
                    <div className="space-y-2 rounded border bg-background p-2">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                        Mensagem pronta ({copiloto.mensagem_pronta.canal})
                      </div>
                      {copiloto.mensagem_pronta.assunto && (
                        <div className="text-xs"><span className="font-medium">Assunto:</span> {copiloto.mensagem_pronta.assunto}</div>
                      )}
                      <div className="whitespace-pre-wrap text-sm">{copiloto.mensagem_pronta.texto}</div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => aberto && enviarMensagemCopiloto(aberto)}>
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Enfileirar envio
                        </Button>
                        {aberto && copiloto.mensagem_pronta.canal === "whatsapp" && waLink(aberto.telefone, copiloto.mensagem_pronta.texto) && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={waLink(aberto.telefone, copiloto.mensagem_pronta.texto)!} target="_blank" rel="noreferrer">
                              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Abrir WhatsApp
                            </a>
                          </Button>
                        )}
                        {aberto && copiloto.mensagem_pronta.canal === "email" && mailLink(aberto.email, copiloto.mensagem_pronta.assunto, copiloto.mensagem_pronta.texto) && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={mailLink(aberto.email, copiloto.mensagem_pronta.assunto, copiloto.mensagem_pronta.texto)!}>
                              <Mail className="mr-1.5 h-3.5 w-3.5" /> Abrir Email
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost"
                          onClick={() => copiar(copiloto.mensagem_pronta.texto, "Mensagem copiada")}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {copiloto?.raw && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap">{copiloto.raw}</div>
              )}
            </TabsContent>

            <TabsContent value="acoes" className="space-y-3">
              {aberto && (() => {
                const seg = classificarSegmento(aberto);
                const info = infoSegmento(seg);
                const tplWa = templatePorSegmento(seg, "whatsapp", aberto);
                const tplEm = templatePorSegmento(seg, "email", aberto);
                const wa = waLink(aberto.telefone, tplWa.texto);
                const em = mailLink(aberto.email, tplEm.assunto, tplEm.texto);
                return (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">
                      Mensagem pronta do sistema recomendado: <strong>{info?.sistema}</strong>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wa && (
                        <Button asChild size="sm">
                          <a href={wa} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp pronto
                          </a>
                        </Button>
                      )}
                      {em && (
                        <Button asChild size="sm" variant="outline">
                          <a href={em}>
                            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email pronto
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => copiar(tplWa.texto, "Mensagem copiada")}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar WhatsApp
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-auto whitespace-pre-wrap rounded border bg-background p-2 text-xs">
                      {tplWa.texto}
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => aberto && runAnalise(aberto)} disabled={iaLoading}>
                  <Sparkles className="mr-2 h-4 w-4" /> Analisar
                </Button>
                <Button size="sm" variant="outline" onClick={() => aberto && runMensagem(aberto, "whatsapp")} disabled={iaLoading}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Gerar WhatsApp (IA)
                </Button>
                <Button size="sm" variant="outline" onClick={() => aberto && runMensagem(aberto, "email")} disabled={iaLoading}>
                  <Mail className="mr-2 h-4 w-4" /> Gerar Email (IA)
                </Button>
              </div>
              {iaLoading && <Skeleton className="h-32" />}
              {iaOutput && (
                <div className="space-y-2">
                  <div className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {iaOutput}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copiar(iaOutput, "Texto copiado")}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
                    </Button>
                    {aberto && ultimoCanal === "whatsapp" && waLink(aberto.telefone, iaOutput) && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={waLink(aberto.telefone, iaOutput)!} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir no WhatsApp
                        </a>
                      </Button>
                    )}
                    {aberto && ultimoCanal === "email" && mailLink(aberto.email, `Contato — ${aberto.empresa || aberto.nome}`, iaOutput) && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={mailLink(aberto.email, `Contato — ${aberto.empresa || aberto.nome}`, iaOutput)!}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir no Email
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sequencia">
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                <Workflow className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Inscrever em:</span>
                <Select value={seqSelecionada} onValueChange={setSeqSelecionada}>
                  <SelectTrigger className="h-8 flex-1"><SelectValue placeholder={seqQ.data?.length ? "Selecionar…" : "Nenhuma ativa"} /></SelectTrigger>
                  <SelectContent>{seqQ.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" disabled={!seqSelecionada || !aberto || enroll.isPending}
                  onClick={() => aberto && enroll.mutate({ lead_id: aberto.id, sequencia_id: seqSelecionada })}>
                  Inscrever
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {aberto?.observacoes && <div className="text-xs text-muted-foreground border-t pt-2">{aberto.observacoes}</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
