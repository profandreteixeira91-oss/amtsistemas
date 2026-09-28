import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { iaAnalisarLead, iaGerarMensagem } from "@/lib/crm/ai-service.functions";
import { iaScoreLead, iaCopiloto, iaEnfileirarMensagem } from "@/lib/crm/scoring.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, MessageCircle, Mail, Phone, Instagram, Copy, ExternalLink,
  Sparkles, Bot, Flame, Send, Building2, User, Tag, Calendar, StickyNote, History,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/leads/$id")({
  head: () => ({ meta: [{ title: "Lead · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LeadDetalhePage,
});

type Lead = {
  id: string; nome: string; email: string | null; telefone: string | null;
  empresa: string | null; cargo: string | null; status: string;
  origem: string | null; created_at: string; updated_at: string;
  observacoes: string | null; score: number; score_motivo: string | null;
  score_atualizado_em: string | null;
  proximo_contato: string | null;
};

const PIPELINE = [
  { value: "novo",         label: "Novo",         cls: "bg-blue-500 hover:bg-blue-600 text-white" },
  { value: "contatado",    label: "Contatado",    cls: "bg-indigo-500 hover:bg-indigo-600 text-white" },
  { value: "qualificado",  label: "Qualificado",  cls: "bg-purple-500 hover:bg-purple-600 text-white" },
  { value: "proposta",     label: "Proposta",     cls: "bg-amber-500 hover:bg-amber-600 text-white" },
  { value: "negociacao",   label: "Negociação",   cls: "bg-orange-500 hover:bg-orange-600 text-white" },
  { value: "ganho",        label: "Ganho",        cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  { value: "perdido",      label: "Perdido",      cls: "bg-rose-500 hover:bg-rose-600 text-white" },
];

function digits(v: string | null | undefined) { return (v ?? "").replace(/\D/g, ""); }
function waLink(tel: string | null, texto?: string) {
  const d = digits(tel); if (!d) return null;
  const numero = d.length <= 11 ? `55${d}` : d;
  const t = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${numero}${t}`;
}
function mailLink(email: string | null, assunto?: string, corpo?: string) {
  if (!email) return null;
  const p: string[] = [];
  if (assunto) p.push(`subject=${encodeURIComponent(assunto)}`);
  if (corpo) p.push(`body=${encodeURIComponent(corpo)}`);
  return `mailto:${email}${p.length ? `?${p.join("&")}` : ""}`;
}
function telLink(tel: string | null) { const d = digits(tel); return d ? `tel:${d}` : null; }
function instagramLink(empresa: string | null, nome: string) {
  const alvo = (empresa || nome || "").trim();
  if (!alvo) return null;
  return `https://www.google.com/search?q=${encodeURIComponent(`${alvo} site:instagram.com`)}`;
}
async function copiar(texto: string, msg = "Copiado!") {
  try { await navigator.clipboard.writeText(texto); toast.success(msg); }
  catch { toast.error("Não consegui copiar"); }
}
function fmtData(iso: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; }
}
function scoreCor(score: number) {
  if (score >= 75) return "text-rose-600";
  if (score >= 50) return "text-amber-600";
  return "text-muted-foreground";
}

function LeadDetalhePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const analisar = useServerFn(iaAnalisarLead);
  const gerarMsg = useServerFn(iaGerarMensagem);
  const scoreFn = useServerFn(iaScoreLead);
  const copilotoFn = useServerFn(iaCopiloto);
  const enfileirarFn = useServerFn(iaEnfileirarMensagem);

  const [iaOutput, setIaOutput] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [copiloto, setCopiloto] = useState<any>(null);
  const [ultimoCanal, setUltimoCanal] = useState<"whatsapp" | "email" | null>(null);

  const leadQ = useQuery({
    queryKey: ["crm_lead", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_leads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Lead | null;
    },
  });
  const lead = leadQ.data;

  const msgsQ = useQuery({
    queryKey: ["crm_lead_mensagens", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_mensagens")
        .select("id, canal, direcao, assunto, conteudo, status, created_at, enviado_em, erro")
        .eq("lead_id", id).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mudarStatus = useMutation({
    mutationFn: async (novo: string) => {
      const { error } = await supabase.from("manager_leads").update({ status: novo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, novo) => {
      toast.success(`Status → ${PIPELINE.find((p) => p.value === novo)?.label ?? novo}`);
      qc.invalidateQueries({ queryKey: ["crm_lead", id] });
      qc.invalidateQueries({ queryKey: ["crm_leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function runAnalise() {
    if (!lead) return;
    setIaLoading(true); setIaOutput(""); setUltimoCanal(null);
    try {
      const r = await analisar({ data: { lead_id: lead.id } });
      setIaOutput(r.content);
      toast.success(`Análise via ${r.provider_usado}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }
  async function runMensagem(canal: "whatsapp" | "email") {
    if (!lead) return;
    setIaLoading(true); setIaOutput(""); setUltimoCanal(canal);
    try {
      const r = await gerarMsg({ data: {
        canal, empresa: lead.empresa || lead.nome, categoria: lead.origem || "",
        tom: "consultivo", objetivo: "agendar demonstração", cta: "agendar 15min",
      }});
      setIaOutput(r.content);
      toast.success(`${canal === "email" ? "Email" : "WhatsApp"} via ${r.provider_usado}`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }
  async function runScore() {
    if (!lead) return;
    setIaLoading(true);
    try {
      const r = await scoreFn({ data: { lead_id: lead.id } });
      toast.success(`Score atualizado: ${r.score} (${r.categoria})`);
      qc.invalidateQueries({ queryKey: ["crm_lead", id] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }
  async function runCopiloto() {
    if (!lead) return;
    setIaLoading(true); setCopiloto(null);
    try {
      const r = await copilotoFn({ data: { lead_id: lead.id } });
      setCopiloto((r as any).briefing ?? { raw: (r as any).raw });
    } catch (e) { toast.error((e as Error).message); }
    finally { setIaLoading(false); }
  }
  async function enfileirarCopiloto() {
    if (!lead || !copiloto?.mensagem_pronta?.texto) return;
    try {
      await enfileirarFn({ data: {
        lead_id: lead.id, canal: copiloto.mensagem_pronta.canal,
        conteudo: copiloto.mensagem_pronta.texto, assunto: copiloto.mensagem_pronta.assunto,
      }});
      toast.success("Mensagem enfileirada");
      qc.invalidateQueries({ queryKey: ["crm_lead_mensagens", id] });
    } catch (e) { toast.error((e as Error).message); }
  }

  if (leadQ.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  }
  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.history.back()}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Lead não encontrado.</CardContent></Card>
      </div>
    );
  }

  const wa = waLink(lead.telefone);
  const em = mailLink(lead.email);
  const tel = telLink(lead.telefone);
  const ig = instagramLink(lead.empresa, lead.nome);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/crm/leads"><ArrowLeft className="mr-1 h-4 w-4" /> Leads</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{lead.empresa || lead.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {[lead.nome !== lead.empresa ? lead.nome : null, lead.cargo].filter(Boolean).join(" · ") || "Sem contato principal"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-primary">
            <Link to="/crm/mensagens-comerciais" search={{ lead: lead.id, sistema: "", canal: "whatsapp", etapa: "primeiro_contato" }}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Mensagens Comerciais
            </Link>
          </Button>
          <Badge variant="secondary" className="text-xs">{lead.status}</Badge>
          <Badge variant="outline" className={`gap-1 text-xs ${scoreCor(lead.score)}`}>
            <Flame className="h-3 w-3" /> Score {lead.score}
          </Badge>
        </div>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Estado no pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PIPELINE.map((p) => {
              const ativo = lead.status === p.value;
              return (
                <Button key={p.value} size="sm" disabled={mudarStatus.isPending}
                  className={ativo ? p.cls : ""}
                  variant={ativo ? "default" : "outline"}
                  onClick={() => !ativo && mudarStatus.mutate(p.value)}>
                  {p.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acesso direto */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Acesso direto</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild disabled={!wa} className="bg-emerald-500 text-white hover:bg-emerald-600">
            <a href={wa ?? "#"} target="_blank" rel="noreferrer" aria-disabled={!wa}>
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild disabled={!em} variant="outline">
            <a href={em ?? "#"} aria-disabled={!em}><Mail className="mr-2 h-4 w-4" /> Email</a>
          </Button>
          <Button asChild disabled={!tel} variant="outline">
            <a href={tel ?? "#"} aria-disabled={!tel}><Phone className="mr-2 h-4 w-4" /> Ligar</a>
          </Button>
          <Button asChild disabled={!ig} variant="outline" className="text-pink-600 border-pink-200 hover:text-pink-700">
            <a href={ig ?? "#"} target="_blank" rel="noreferrer" aria-disabled={!ig}>
              <Instagram className="mr-2 h-4 w-4" /> Instagram
            </a>
          </Button>
          {lead.telefone && (
            <Button variant="ghost" size="sm" onClick={() => copiar(lead.telefone!, "Telefone copiado")}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar telefone
            </Button>
          )}
          {lead.email && (
            <Button variant="ghost" size="sm" onClick={() => copiar(lead.email!, "Email copiado")}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar email
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Info detalhada */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><User className="h-4 w-4" /> Contato</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Nome" value={lead.nome} />
            <InfoRow label="Cargo" value={lead.cargo} />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="Telefone" value={lead.telefone} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4" /> Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Empresa" value={lead.empresa} />
            <InfoRow label="Origem" value={lead.origem} icon={<Tag className="h-3.5 w-3.5" />} />
            <InfoRow label="Próximo contato" value={fmtData(lead.proximo_contato)} icon={<Calendar className="h-3.5 w-3.5" />} />
            <InfoRow label="Criado em" value={fmtData(lead.created_at)} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Flame className="h-4 w-4" /> Score & Observações</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className={`text-3xl font-semibold ${scoreCor(lead.score)}`}>{lead.score}</span>
              <span className="ml-2 text-xs text-muted-foreground">atualizado em {fmtData(lead.score_atualizado_em)}</span>
            </div>
            {lead.score_motivo && (
              <div className="rounded-md border bg-muted/30 p-2 text-xs"><span className="font-medium">Motivo:</span> {lead.score_motivo}</div>
            )}
            <Separator />
            <div className="flex items-start gap-2">
              <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {lead.observacoes || "Sem observações."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IA */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4" /> Ações de IA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={runCopiloto} disabled={iaLoading}><Bot className="mr-1.5 h-4 w-4" /> Copiloto</Button>
            <Button size="sm" variant="outline" onClick={runAnalise} disabled={iaLoading}><Sparkles className="mr-1.5 h-4 w-4" /> Analisar</Button>
            <Button size="sm" variant="outline" onClick={() => runMensagem("whatsapp")} disabled={iaLoading}><MessageCircle className="mr-1.5 h-4 w-4" /> Gerar WhatsApp</Button>
            <Button size="sm" variant="outline" onClick={() => runMensagem("email")} disabled={iaLoading}><Mail className="mr-1.5 h-4 w-4" /> Gerar Email</Button>
            <Button size="sm" variant="outline" onClick={runScore} disabled={iaLoading}><Flame className="mr-1.5 h-4 w-4" /> Recalcular score</Button>
          </div>
          {iaLoading && <Skeleton className="h-32" />}
          {iaOutput && (
            <div className="space-y-2">
              <div className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{iaOutput}</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => copiar(iaOutput, "Texto copiado")}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar</Button>
                {ultimoCanal === "whatsapp" && waLink(lead.telefone, iaOutput) && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={waLink(lead.telefone, iaOutput)!} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir WhatsApp</a>
                  </Button>
                )}
                {ultimoCanal === "email" && mailLink(lead.email, `Contato — ${lead.empresa || lead.nome}`, iaOutput) && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={mailLink(lead.email, `Contato — ${lead.empresa || lead.nome}`, iaOutput)!}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir Email</a>
                  </Button>
                )}
              </div>
            </div>
          )}
          {copiloto?.resumo && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
              <div><span className="font-semibold">Resumo:</span> {copiloto.resumo}</div>
              <div><span className="font-semibold">Próxima ação:</span> {copiloto.proxima_acao} <span className="text-xs text-muted-foreground">({copiloto.quando})</span></div>
              {copiloto.mensagem_pronta?.texto && (
                <div className="space-y-2 rounded border bg-background p-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Mensagem pronta ({copiloto.mensagem_pronta.canal})</div>
                  {copiloto.mensagem_pronta.assunto && <div className="text-xs"><span className="font-medium">Assunto:</span> {copiloto.mensagem_pronta.assunto}</div>}
                  <div className="whitespace-pre-wrap text-sm">{copiloto.mensagem_pronta.texto}</div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={enfileirarCopiloto}><Send className="mr-1.5 h-3.5 w-3.5" /> Enfileirar envio</Button>
                    {copiloto.mensagem_pronta.canal === "whatsapp" && waLink(lead.telefone, copiloto.mensagem_pronta.texto) && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={waLink(lead.telefone, copiloto.mensagem_pronta.texto)!} target="_blank" rel="noreferrer"><MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp</a>
                      </Button>
                    )}
                    {copiloto.mensagem_pronta.canal === "email" && mailLink(lead.email, copiloto.mensagem_pronta.assunto, copiloto.mensagem_pronta.texto) && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={mailLink(lead.email, copiloto.mensagem_pronta.assunto, copiloto.mensagem_pronta.texto)!}><Mail className="mr-1.5 h-3.5 w-3.5" /> Email</a>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => copiar(copiloto.mensagem_pronta.texto, "Mensagem copiada")}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><History className="h-4 w-4" /> Histórico de mensagens</CardTitle></CardHeader>
        <CardContent>
          {msgsQ.isLoading ? <Skeleton className="h-24" /> :
            (msgsQ.data?.length ?? 0) === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma mensagem registrada ainda.</div>
            ) : (
              <div className="divide-y">
                {msgsQ.data!.map((m: any) => (
                  <div key={m.id} className="flex flex-wrap items-start gap-2 py-2 text-sm">
                    <Badge variant="outline" className="text-[10px] uppercase">{m.canal}</Badge>
                    <Badge variant={m.direcao === "saida" ? "default" : "secondary"} className="text-[10px]">{m.direcao}</Badge>
                    <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">{fmtData(m.created_at)}</span>
                    <div className="basis-full">
                      {m.assunto && <div className="text-xs font-medium">{m.assunto}</div>}
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground">{m.conteudo}</div>
                      {m.erro && <div className="mt-1 text-xs text-rose-600">Erro: {m.erro}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 break-words">{icon}{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}
