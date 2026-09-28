import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Sparkles, MessageCircle, Mail, Instagram, Facebook, Copy, Send, Edit3,
  Star, CheckCircle2, Search, Lightbulb, ArrowRight,
} from "lucide-react";
import {
  CANAIS, ETAPAS, SISTEMAS,
  type CanalId, type EtapaId, type SistemaId,
  classificarSistema, preencherVariaveis, filtrarTemplates,
  insightsLead, type Template,
} from "@/lib/crm/templates-comerciais";
import { iaGerarMensagem } from "@/lib/crm/ai-service.functions";
import { criarMensagemManual } from "@/lib/crm/mensagens.functions";

const searchSchema = z.object({
  lead: fallback(z.string(), "").default(""),
  sistema: fallback(z.string(), "").default(""),
  canal: fallback(z.string(), "whatsapp").default("whatsapp"),
  etapa: fallback(z.string(), "primeiro_contato").default("primeiro_contato"),
});

export const Route = createFileRoute("/crm/mensagens-comerciais")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [
    { title: "Mensagens Comerciais · CRM" },
    { name: "robots", content: "noindex, nofollow" },
  ]}),
  component: MensagensComerciaisPage,
});

type LeadRow = {
  id: string; nome: string; email: string | null; telefone: string | null;
  empresa: string | null; origem: string | null; observacoes: string | null;
  score: number | null; created_at: string; status: string;
};

function digits(v: string | null) { return (v ?? "").replace(/\D/g, ""); }
function waLink(tel: string | null, texto?: string) {
  const d = digits(tel); if (!d) return null;
  const num = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${num}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}
function mailLink(email: string | null, assunto?: string, corpo?: string) {
  if (!email) return null;
  const p: string[] = [];
  if (assunto) p.push(`subject=${encodeURIComponent(assunto)}`);
  if (corpo) p.push(`body=${encodeURIComponent(corpo)}`);
  return `mailto:${email}${p.length ? `?${p.join("&")}` : ""}`;
}
async function copiar(t: string) {
  try { await navigator.clipboard.writeText(t); toast.success("Copiado"); }
  catch { toast.error("Falha ao copiar"); }
}

const CANAL_ICON: Record<CanalId, any> = {
  whatsapp: MessageCircle, instagram: Instagram, facebook: Facebook, email: Mail,
};
const SISTEMA_CLASSES: Record<SistemaId, string> = {
  hotel: "border-indigo-200 bg-indigo-50 text-indigo-700",
  restaurant: "border-amber-200 bg-amber-50 text-amber-800",
  clinic: "border-sky-200 bg-sky-50 text-sky-700",
  vet: "border-emerald-200 bg-emerald-50 text-emerald-700",
  outro: "border-muted bg-muted/40 text-muted-foreground",
};

function MensagensComerciaisPage() {
  const s = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const gerarIA = useServerFn(iaGerarMensagem);
  const registrarMsg = useServerFn(criarMensagemManual);

  const [iaLoading, setIaLoading] = useState(false);
  const [editando, setEditando] = useState<{ template: Template; texto: string; assunto: string } | null>(null);

  /* Lead opcional (via ?lead=<uuid>) */
  const leadQ = useQuery({
    queryKey: ["msg_com_lead", s.lead],
    enabled: !!s.lead,
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_leads")
        .select("id, nome, email, telefone, empresa, origem, observacoes, score, created_at, status")
        .eq("id", s.lead).maybeSingle();
      if (error) throw error;
      return data as LeadRow | null;
    },
  });
  const lead = leadQ.data;

  /* Sistema recomendado: se lead existir e não vier na URL, classificar */
  const sistemaAuto: SistemaId = useMemo(() => {
    if (s.sistema && s.sistema in SISTEMAS) return s.sistema as SistemaId;
    if (lead) return classificarSistema(lead);
    return "hotel";
  }, [s.sistema, lead]);

  const canalAtivo = (s.canal || "whatsapp") as CanalId;
  const etapaAtiva = (s.etapa || "primeiro_contato") as EtapaId;

  const setSearch = (patch: Partial<{ sistema: string; canal: string; etapa: string; lead: string }>) => {
    navigate({ search: (prev: any) => ({ ...prev, ...patch }) });
  };

  const templates = useMemo(
    () => filtrarTemplates({ sistema: sistemaAuto, canal: canalAtivo, etapa: etapaAtiva }),
    [sistemaAuto, canalAtivo, etapaAtiva],
  );

  const insights = useMemo(() => (lead ? insightsLead(lead) : []), [lead]);
  const sistemaInfo = SISTEMAS[sistemaAuto];

  async function gerarComIA() {
    setIaLoading(true);
    try {
      const r = await gerarIA({ data: {
        canal: canalAtivo === "email" ? "email" : canalAtivo === "instagram" ? "instagram" : "whatsapp",
        empresa: lead?.empresa || lead?.nome || "empresa prospectada",
        categoria: `${sistemaInfo.nome} — segmento ${sistemaAuto}`,
        tom: "consultivo",
        objetivo: `apresentar o ${sistemaInfo.nome} e ${sistemaInfo.cta_principal.toLowerCase()}`,
        cta: sistemaInfo.cta_principal,
      }});
      const novo: Template = {
        id: `ia_${Date.now()}`,
        sistema: sistemaAuto, etapa: etapaAtiva, canal: canalAtivo,
        titulo: `IA · ${sistemaInfo.nome}`,
        texto: (r as any).content ?? "",
      };
      setEditando({ template: novo, texto: novo.texto, assunto: "" });
      toast.success(`Mensagem gerada via ${(r as any).provider_usado ?? "IA"}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao gerar");
    } finally { setIaLoading(false); }
  }

  const registrar = useMutation({
    mutationFn: async (payload: { canal: CanalId; conteudo: string; assunto?: string; destinatario?: string | null }) => {
      return registrarMsg({ data: {
        lead_id: lead?.id ?? null,
        canal: payload.canal === "facebook" || payload.canal === "instagram" ? "instagram" : payload.canal,
        conteudo: payload.conteudo,
        assunto: payload.assunto ?? null,
        destinatario: payload.destinatario ?? null,
        enviar_agora: false,
      }});
    },
    onSuccess: () => {
      toast.success("Registrado na timeline do lead");
      qc.invalidateQueries({ queryKey: ["crm_lead_mensagens", lead?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao registrar"),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Mensagens Comerciais Inteligentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Templates por sistema recomendado, canal e etapa do funil — com variáveis dinâmicas e geração por IA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {leadQ.isLoading && <Skeleton className="h-9 w-40" />}
          {lead && (
            <Badge variant="outline" className="px-3 py-1.5 text-xs">
              Lead: <span className="ml-1 font-medium">{lead.empresa || lead.nome}</span>
            </Badge>
          )}
          <Button onClick={gerarComIA} disabled={iaLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {iaLoading ? "Gerando…" : "Gerar nova mensagem com IA"}
          </Button>
        </div>
      </header>

      {/* Sistema recomendado */}
      <Card className={`border-2 ${SISTEMA_CLASSES[sistemaAuto]}`}>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="text-4xl">{sistemaInfo.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide opacity-70">Sistema recomendado</span>
              {lead && s.sistema === "" && (
                <Badge variant="secondary" className="text-[10px]">detectado automaticamente</Badge>
              )}
            </div>
            <div className="text-xl font-semibold">{sistemaInfo.nome}</div>
            <p className="mt-1 text-xs opacity-80 line-clamp-2">
              {sistemaInfo.beneficios.slice(0, 3).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(Object.keys(SISTEMAS) as SistemaId[]).filter((k) => k !== "outro").map((k) => (
              <Button key={k} size="sm" variant={k === sistemaAuto ? "default" : "outline"}
                onClick={() => setSearch({ sistema: k })}>
                {SISTEMAS[k].emoji} {SISTEMAS[k].nome}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" /> Inteligência comercial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.map((i, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">{i}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canal + Etapa */}
      <div className="grid gap-3 md:grid-cols-[2fr,3fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Canal</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={canalAtivo} onValueChange={(v) => setSearch({ canal: v })}>
              <TabsList className="grid w-full grid-cols-4">
                {CANAIS.map((c) => {
                  const Icon = CANAL_ICON[c.id];
                  return (
                    <TabsTrigger key={c.id} value={c.id} className="text-xs">
                      <Icon className="mr-1 h-3.5 w-3.5" /> {c.label.split(" ")[0]}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Etapa do funil</CardTitle></CardHeader>
          <CardContent>
            <Select value={etapaAtiva} onValueChange={(v) => setSearch({ etapa: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ETAPAS.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.ordem}. {e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Grid de templates */}
      <div className="grid gap-3 md:grid-cols-2">
        {templates.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Nenhum template neste recorte. Use <strong>Gerar nova mensagem com IA</strong> acima.
            </CardContent>
          </Card>
        )}
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            lead={lead ?? undefined}
            onEditar={() => setEditando({ template: t, texto: t.texto, assunto: t.assunto ?? "" })}
            onRegistrar={(canal, texto, assunto) => registrar.mutate({
              canal, conteudo: texto, assunto, destinatario: canal === "email" ? lead?.email : lead?.telefone,
            })}
          />
        ))}
      </div>

      {/* Modal editar */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> Personalizar mensagem
            </DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {editando.template.titulo} · {editando.template.canal} · {SISTEMAS[editando.template.sistema].nome}
              </div>
              {editando.template.canal === "email" && (
                <div>
                  <Label>Assunto</Label>
                  <Input value={editando.assunto}
                    onChange={(e) => setEditando({ ...editando, assunto: e.target.value })} />
                </div>
              )}
              <div>
                <Label>Mensagem</Label>
                <Textarea rows={10} value={editando.texto}
                  onChange={(e) => setEditando({ ...editando, texto: e.target.value })} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Variáveis suportadas: {"{{empresa}} {{nome}} {{cidade}} {{sistema}} {{url}} {{cta}} {{responsavel}}"}
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Pré-visualização</div>
                <div className="whitespace-pre-wrap">
                  {preencherVariaveis(editando.texto, editando.template.sistema, lead ?? undefined)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            {editando && (
              <>
                <Button variant="ghost" onClick={() => copiar(
                  preencherVariaveis(editando.texto, editando.template.sistema, lead ?? undefined),
                )}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar
                </Button>
                {editando.template.canal === "whatsapp" && lead?.telefone && (
                  <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-600">
                    <a target="_blank" rel="noreferrer" href={waLink(
                      lead.telefone,
                      preencherVariaveis(editando.texto, editando.template.sistema, lead),
                    ) ?? "#"}>
                      <MessageCircle className="mr-2 h-4 w-4" /> Abrir WhatsApp
                    </a>
                  </Button>
                )}
                {editando.template.canal === "email" && lead?.email && (
                  <Button asChild variant="secondary">
                    <a href={mailLink(
                      lead.email,
                      preencherVariaveis(editando.assunto || "", editando.template.sistema, lead),
                      preencherVariaveis(editando.texto, editando.template.sistema, lead),
                    ) ?? "#"}>
                      <Mail className="mr-2 h-4 w-4" /> Abrir Email
                    </a>
                  </Button>
                )}
                <Button onClick={() => {
                  registrar.mutate({
                    canal: editando.template.canal,
                    conteudo: preencherVariaveis(editando.texto, editando.template.sistema, lead ?? undefined),
                    assunto: editando.assunto
                      ? preencherVariaveis(editando.assunto, editando.template.sistema, lead ?? undefined)
                      : undefined,
                    destinatario: editando.template.canal === "email" ? lead?.email : lead?.telefone,
                  });
                  setEditando(null);
                }}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Salvar & Registrar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════ Card de template ═══════════ */

function TemplateCard({
  template, lead, onEditar, onRegistrar,
}: {
  template: Template;
  lead?: LeadRow;
  onEditar: () => void;
  onRegistrar: (canal: CanalId, texto: string, assunto?: string) => void;
}) {
  const textoFinal = useMemo(
    () => preencherVariaveis(template.texto, template.sistema, lead),
    [template, lead],
  );
  const assuntoFinal = useMemo(
    () => template.assunto ? preencherVariaveis(template.assunto, template.sistema, lead) : undefined,
    [template, lead],
  );
  const Icon = CANAL_ICON[template.canal];
  const wa = template.canal === "whatsapp" ? waLink(lead?.telefone ?? null, textoFinal) : null;
  const em = template.canal === "email" ? mailLink(lead?.email ?? null, assuntoFinal, textoFinal) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4" /> {template.titulo}
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">{template.canal}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {assuntoFinal && (
          <div className="text-xs">
            <span className="font-medium">Assunto:</span> {assuntoFinal}
          </div>
        )}
        <div className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
          {textoFinal}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => copiar(textoFinal)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
          </Button>
          <Button size="sm" variant="ghost" onClick={onEditar}>
            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Editar
          </Button>
          {wa && (
            <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" asChild>
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
              </a>
            </Button>
          )}
          {em && (
            <Button size="sm" variant="secondary" asChild>
              <a href={em}>
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
              </a>
            </Button>
          )}
          {template.canal === "instagram" && (
            <Button size="sm" variant="outline" asChild>
              <a target="_blank" rel="noreferrer"
                href={`https://www.google.com/search?q=${encodeURIComponent((lead?.empresa || lead?.nome || "") + " site:instagram.com")}`}>
                <Instagram className="mr-1.5 h-3.5 w-3.5" /> Abrir IG
              </a>
            </Button>
          )}
          {lead && (
            <Button size="sm" variant="outline" onClick={() => onRegistrar(template.canal, textoFinal, assuntoFinal)}>
              <Send className="mr-1.5 h-3.5 w-3.5" /> Registrar envio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
