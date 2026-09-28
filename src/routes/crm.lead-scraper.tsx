import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Radar, Play, Loader2, MapPin, Globe, Instagram, Facebook, Linkedin,
  Mail, Phone, MessageCircle, Star, ExternalLink, Download, Send,
  RefreshCw, Ban, CheckCircle2, AlertCircle, Filter, Sparkles, Building2,
  Bot, CalendarClock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getCatalogo, iniciarBusca, continuarBusca, cancelarBusca,
  listarBuscas, listarLeads, enviarLeadCRM,
  getAutoConfig, salvarAutoConfig, executarAutoScraperAgora,
} from "@/lib/lead-scraper.functions";

export const Route = createFileRoute("/crm/lead-scraper")({
  component: LeadScraperPage,
});

// ============================================================================

type Sistema = { id: string; nome: string; slug: string; cor: string | null; logo_url: string | null };
type Nicho = { id: string; sistema_id: string; slug: string; nome: string; termos: string[]; ativo: boolean };
type Cidade = { uf: string; nome: string; populacao: number | null; latitude: number | null; longitude: number | null };

type Contadores = {
  encontrados: number;
  validos: number;
  descartados_sem_contato: number;
  duplicados: number;
  com_email: number;
  com_whatsapp: number;
  com_instagram: number;
  com_site: number;
};

type Busca = {
  id: string;
  sistema_id: string | null;
  tipo_negocio: string;
  cidade: string | null;
  uf: string | null;
  escopo: string;
  nichos: string[] | null;
  status: string;
  cidade_atual: string | null;
  total_cidades: number;
  cidades_processadas: number;
  contadores: Contadores | null;
  cancelada: boolean;
  created_at: string;
  iniciado_em: string | null;
  finalizado_em: string | null;
  manager_sistemas?: { nome: string; slug: string; cor: string | null } | null;
};

type LeadCapturado = {
  id: string;
  busca_id: string | null;
  sistema_id: string | null;
  nome: string;
  categoria: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  google_maps_url: string | null;
  avaliacao: number | null;
  total_avaliacoes: number | null;
  score: number;
  enviado_crm: boolean;
  capturado_em: string;
};

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ============================================================================

function LeadScraperPage() {
  const [tab, setTab] = useState<"nova" | "auto" | "buscas" | "leads">("nova");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Radar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Scraper B2B</h1>
          <p className="text-sm text-muted-foreground">
            Prospecção qualificada de empresas reais para os sistemas AMT.
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="nova"><Play className="w-4 h-4 mr-1.5" /> Nova busca</TabsTrigger>
          <TabsTrigger value="auto"><Bot className="w-4 h-4 mr-1.5" /> Automação diária</TabsTrigger>
          <TabsTrigger value="buscas"><Radar className="w-4 h-4 mr-1.5" /> Buscas</TabsTrigger>
          <TabsTrigger value="leads"><Building2 className="w-4 h-4 mr-1.5" /> Leads capturados</TabsTrigger>
        </TabsList>
        <TabsContent value="nova"><NovaBuscaTab /></TabsContent>
        <TabsContent value="auto"><AutomacaoTab /></TabsContent>
        <TabsContent value="buscas"><BuscasTab onOpenLeads={() => setTab("leads")} /></TabsContent>
        <TabsContent value="leads"><LeadsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Aba: Nova busca
// ============================================================================

function NovaBuscaTab() {
  const qc = useQueryClient();
  const catalogoFn = useServerFn(getCatalogo);
  const iniciarFn = useServerFn(iniciarBusca);

  const { data: catalogo, isLoading } = useQuery({
    queryKey: ["scraper-catalogo"],
    queryFn: () => catalogoFn(),
  });

  const [sistemaId, setSistemaId] = useState<string>("");
  const [nichosSel, setNichosSel] = useState<Set<string>>(new Set());
  const [escopo, setEscopo] = useState<"cidade" | "uf" | "brasil">("cidade");
  const [uf, setUf] = useState<string>("");
  const [cidade, setCidade] = useState<string>("");
  const [enriquecer, setEnriquecer] = useState(true);

  const sistemas: Sistema[] = (catalogo?.sistemas ?? []) as Sistema[];
  const nichos: Nicho[] = (catalogo?.nichos ?? []) as Nicho[];
  const cidades: Cidade[] = (catalogo?.cidades ?? []) as Cidade[];

  const nichosDoSistema = useMemo(
    () => nichos.filter((n) => n.sistema_id === sistemaId),
    [nichos, sistemaId],
  );

  const cidadesDoUF = useMemo(
    () => cidades.filter((c) => (uf ? c.uf === uf : true)),
    [cidades, uf],
  );

  const iniciar = useMutation({
    mutationFn: async () => {
      if (!sistemaId) throw new Error("Selecione um sistema");
      if (nichosSel.size === 0) throw new Error("Selecione ao menos um nicho");

      const cidadeObj = cidades.find((c) => c.uf === uf && c.nome === cidade);
      return iniciarFn({
        data: {
          sistema_id: sistemaId,
          nichos_slugs: Array.from(nichosSel),
          escopo,
          cidade: escopo === "cidade" ? cidade : null,
          uf: escopo === "cidade" || escopo === "uf" ? uf : null,
          latitude: escopo === "cidade" ? cidadeObj?.latitude ?? null : null,
          longitude: escopo === "cidade" ? cidadeObj?.longitude ?? null : null,
          raio_km: null,
          limite_por_busca: 20,
          enriquecer,
        },
      });
    },
    onSuccess: (r) => {
      toast.success(
        `Busca iniciada: ${r.processadas}/${r.total} cidades processadas. Válidos: ${r.contadores.validos}.`,
      );
      qc.invalidateQueries({ queryKey: ["scraper-buscas"] });
      qc.invalidateQueries({ queryKey: ["scraper-leads"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao iniciar"),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="grid md:grid-cols-3 gap-4 mt-4">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" /> Configuração da busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Sistema alvo</Label>
            <Select value={sistemaId} onValueChange={(v) => { setSistemaId(v); setNichosSel(new Set()); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o sistema" /></SelectTrigger>
              <SelectContent>
                {sistemas.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sistemaId && (
            <div className="space-y-2">
              <Label>Nichos de prospecção</Label>
              {nichosDoSistema.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum nicho cadastrado para este sistema. Crie um nicho para começar.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 border rounded-md p-3">
                  {nichosDoSistema.map((n) => {
                    const on = nichosSel.has(n.slug);
                    return (
                      <label key={n.id} className="flex items-start gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={on}
                          onCheckedChange={(v) => {
                            const next = new Set(nichosSel);
                            if (v) next.add(n.slug); else next.delete(n.slug);
                            setNichosSel(next);
                          }}
                        />
                        <div>
                          <div className="font-medium leading-tight">{n.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {n.termos.slice(0, 4).join(" · ")}{n.termos.length > 4 ? " …" : ""}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Escopo geográfico</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["cidade", "uf", "brasil"] as const).map((op) => (
                <Button
                  key={op}
                  type="button"
                  variant={escopo === op ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEscopo(op)}
                >
                  {op === "cidade" ? "Cidade" : op === "uf" ? "Estado" : "Brasil"}
                </Button>
              ))}
            </div>
          </div>

          {(escopo === "cidade" || escopo === "uf") && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={uf} onValueChange={(v) => { setUf(v); setCidade(""); }}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {escopo === "cidade" && (
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select value={cidade} onValueChange={setCidade} disabled={!uf}>
                    <SelectTrigger><SelectValue placeholder={uf ? "Selecione a cidade" : "Selecione UF primeiro"} /></SelectTrigger>
                    <SelectContent>
                      {cidadesDoUF.map((c) => (
                        <SelectItem key={`${c.uf}-${c.nome}`} value={c.nome}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={enriquecer} onCheckedChange={(v) => setEnriquecer(Boolean(v))} />
            Enriquecer contatos visitando o site das empresas (recomendado)
          </label>

          {(() => {
            const faltando: string[] = [];
            if (!sistemaId) faltando.push("selecione o sistema alvo");
            else if (nichosDoSistema.length === 0) faltando.push("cadastre pelo menos um nicho para este sistema em CRM → Configurações → Nichos");
            else if (nichosSel.size === 0) faltando.push("marque pelo menos um nicho");
            if (escopo === "cidade" && (!uf || !cidade)) faltando.push("escolha UF e cidade");
            if (escopo === "uf" && !uf) faltando.push("escolha a UF");
            const bloqueado = faltando.length > 0 || iniciar.isPending;
            return (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={bloqueado}
                  onClick={() => iniciar.mutate()}
                >
                  {iniciar.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando…</> : <><Play className="w-4 h-4 mr-2" /> Iniciar prospecção</>}
                </Button>
                {faltando.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Para liberar a prospecção: {faltando.join(" · ")}.
                  </p>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong className="text-foreground">1.</strong> Escolha o sistema (ex.: AMT Restaurant).</p>
          <p><strong className="text-foreground">2.</strong> Marque os nichos (pizzaria, hamburgueria…).</p>
          <p><strong className="text-foreground">3.</strong> Defina o escopo geográfico.</p>
          <p><strong className="text-foreground">4.</strong> A busca consulta o Google Maps e enriquece com Firecrawl, retornando só empresas com pelo menos um contato válido.</p>
          <p>Buscas grandes são processadas em lotes — se pausar, use "Retomar" na aba Buscas.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Aba: Buscas (histórico + progresso)
// ============================================================================

function BuscasTab({ onOpenLeads }: { onOpenLeads: () => void }) {
  const qc = useQueryClient();
  const listarFn = useServerFn(listarBuscas);
  const continuarFn = useServerFn(continuarBusca);
  const cancelarFn = useServerFn(cancelarBusca);

  const { data: buscas, isLoading, refetch } = useQuery({
    queryKey: ["scraper-buscas"],
    queryFn: () => listarFn() as Promise<Busca[]>,
    refetchInterval: 5000,
  });

  const continuar = useMutation({
    mutationFn: (id: string) => continuarFn({ data: { busca_id: id } }),
    onSuccess: () => {
      toast.success("Continuando busca…");
      qc.invalidateQueries({ queryKey: ["scraper-buscas"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const cancelar = useMutation({
    mutationFn: (id: string) => cancelarFn({ data: { busca_id: id } }),
    onSuccess: () => {
      toast.success("Busca cancelada");
      qc.invalidateQueries({ queryKey: ["scraper-buscas"] });
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full mt-4" />;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar
        </Button>
      </div>
      {(buscas ?? []).length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma busca ainda. Vá para "Nova busca" para começar.
        </CardContent></Card>
      )}
      {(buscas ?? []).map((b) => {
        const c = b.contadores ?? { encontrados: 0, validos: 0, descartados_sem_contato: 0, duplicados: 0, com_email: 0, com_whatsapp: 0, com_instagram: 0, com_site: 0 };
        const pct = b.total_cidades > 0 ? Math.round((b.cidades_processadas / b.total_cidades) * 100) : 0;
        return (
          <Card key={b.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{b.manager_sistemas?.nome ?? "—"}</Badge>
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{b.tipo_negocio}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {b.escopo === "cidade" ? `${b.cidade}/${b.uf}` : b.escopo === "uf" ? `Estado ${b.uf}` : "Brasil inteiro"}
                    {b.cidade_atual && <span className="ml-2">· {b.cidade_atual}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {b.status === "pausado" && !b.cancelada && (
                    <Button size="sm" onClick={() => continuar.mutate(b.id)} disabled={continuar.isPending}>
                      <Play className="w-3.5 h-3.5 mr-1" /> Retomar
                    </Button>
                  )}
                  {(b.status === "processando" || b.status === "pausado") && !b.cancelada && (
                    <Button size="sm" variant="outline" onClick={() => cancelar.mutate(b.id)}>
                      <Ban className="w-3.5 h-3.5 mr-1" /> Cancelar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={onOpenLeads}>
                    Ver leads
                  </Button>
                </div>
              </div>

              <div>
                <Progress value={pct} className="h-1.5" />
                <div className="text-xs text-muted-foreground mt-1">
                  {b.cidades_processadas}/{b.total_cidades} cidades ({pct}%)
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <StatBadge label="Encontrados" value={c.encontrados} />
                <StatBadge label="Válidos" value={c.validos} tone="success" />
                <StatBadge label="Duplicados" value={c.duplicados} />
                <StatBadge label="Sem contato" value={c.descartados_sem_contato} tone="muted" />
                <StatBadge label="Com e-mail" value={c.com_email} icon={<Mail className="w-3 h-3" />} />
                <StatBadge label="Com WhatsApp" value={c.com_whatsapp} icon={<MessageCircle className="w-3 h-3" />} />
                <StatBadge label="Com Instagram" value={c.com_instagram} icon={<Instagram className="w-3 h-3" />} />
                <StatBadge label="Com site" value={c.com_site} icon={<Globe className="w-3 h-3" />} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    processando: { label: "Processando", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    concluido: { label: "Concluído", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
    pausado: { label: "Pausado", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: <AlertCircle className="w-3 h-3" /> },
    cancelado: { label: "Cancelado", cls: "bg-slate-500/10 text-slate-600 border-slate-500/30", icon: <Ban className="w-3 h-3" /> },
    erro: { label: "Erro", cls: "bg-red-500/10 text-red-600 border-red-500/30", icon: <AlertCircle className="w-3 h-3" /> },
  };
  const it = map[status] ?? map.processando;
  return <Badge variant="outline" className={`gap-1 ${it.cls}`}>{it.icon}{it.label}</Badge>;
}

function StatBadge({ label, value, tone, icon }: { label: string; value: number; tone?: "success" | "muted"; icon?: React.ReactNode }) {
  const cls = tone === "success" ? "bg-emerald-500/10 text-emerald-700" : tone === "muted" ? "bg-muted text-muted-foreground" : "bg-primary/5";
  return (
    <div className={`rounded-md px-2 py-1.5 flex items-center justify-between gap-2 ${cls}`}>
      <span className="flex items-center gap-1">{icon}{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// ============================================================================
// Aba: Leads capturados
// ============================================================================

function LeadsTab() {
  const qc = useQueryClient();
  const listarFn = useServerFn(listarLeads);
  const enviarFn = useServerFn(enviarLeadCRM);
  const catalogoFn = useServerFn(getCatalogo);

  const { data: catalogo } = useQuery({ queryKey: ["scraper-catalogo"], queryFn: () => catalogoFn() });
  const sistemas: Sistema[] = (catalogo?.sistemas ?? []) as Sistema[];

  const [sistemaId, setSistemaId] = useState<string>("all");
  const [uf, setUf] = useState<string>("all");
  const [scoreMin, setScoreMin] = useState<string>("0");
  const [apenasEmail, setApenasEmail] = useState(false);
  const [apenasWA, setApenasWA] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["scraper-leads", sistemaId, uf, scoreMin, apenasEmail, apenasWA, q],
    queryFn: () =>
      listarFn({
        data: {
          sistema_id: sistemaId === "all" ? null : sistemaId,
          uf: uf === "all" ? null : uf,
          score_min: Number(scoreMin) || null,
          apenas_email: apenasEmail || undefined,
          apenas_whatsapp: apenasWA || undefined,
          q: q || null,
          limite: 200,
        },
      }) as Promise<LeadCapturado[]>,
  });

  const enviar = useMutation({
    mutationFn: (ids: string[]) => enviarFn({ data: { lead_ids: ids } }),
    onSuccess: (r) => {
      toast.success(`${r.enviados} lead(s) enviado(s) para o CRM.`);
      setSel(new Set());
      qc.invalidateQueries({ queryKey: ["scraper-leads"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  function exportar(fmt: "csv" | "json") {
    const rows = leads ?? [];
    if (rows.length === 0) return toast.info("Nada para exportar");
    if (fmt === "json") {
      downloadFile(`leads-${Date.now()}.json`, JSON.stringify(rows, null, 2), "application/json");
      return;
    }
    const cols: Array<keyof LeadCapturado> = [
      "nome","categoria","cidade","uf","endereco","telefone","whatsapp","email",
      "website","instagram","facebook","linkedin","google_maps_url","avaliacao","total_avaliacoes","score",
    ];
    const header = cols.join(",");
    const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\n");
    downloadFile(`leads-${Date.now()}.csv`, `${header}\n${body}`, "text/csv");
  }

  return (
    <div className="mt-4 space-y-3">
      <Card>
        <CardContent className="p-4 grid md:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">Sistema</Label>
            <Select value={sistemaId} onValueChange={setSistemaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sistemas.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">UF</Label>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {UF_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Score mínimo</Label>
            <Select value={scoreMin} onValueChange={setScoreMin}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["0","1","2","3","4","5"].map((s) => <SelectItem key={s} value={s}>{s}★</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Buscar por nome</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: pousada, restaurante…" />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1 text-xs">
              <Checkbox checked={apenasEmail} onCheckedChange={(v) => setApenasEmail(Boolean(v))} /> Email
            </label>
            <label className="flex items-center gap-1 text-xs">
              <Checkbox checked={apenasWA} onCheckedChange={(v) => setApenasWA(Boolean(v))} /> WA
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={
                (leads?.length ?? 0) > 0 && sel.size === (leads?.length ?? 0)
                  ? true
                  : sel.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(v) => {
                if (v) setSel(new Set((leads ?? []).map((l) => l.id)));
                else setSel(new Set());
              }}
            />
            Selecionar todos
          </label>
          <div className="text-sm text-muted-foreground">
            {leads?.length ?? 0} lead(s) — {sel.size} selecionado(s)
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportar("csv")}>
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportar("json")}>
            <Download className="w-3.5 h-3.5 mr-1" /> JSON
          </Button>
          <Button
            size="sm"
            disabled={sel.size === 0 || enviar.isPending}
            onClick={() => enviar.mutate(Array.from(sel))}
          >
            <Send className="w-3.5 h-3.5 mr-1" /> Enviar {sel.size > 0 ? sel.size : ""} p/ CRM
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (leads ?? []).length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhum lead capturado com esses filtros.
        </CardContent></Card>
      ) : (
        <ScrollArea className="h-[560px]">
          <div className="space-y-2 pr-2">
            {(leads ?? []).map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                selecionado={sel.has(l.id)}
                onToggle={() => {
                  const next = new Set(sel);
                  if (next.has(l.id)) next.delete(l.id); else next.add(l.id);
                  setSel(next);
                }}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function LeadCard({ lead, selecionado, onToggle }: { lead: LeadCapturado; selecionado: boolean; onToggle: () => void }) {
  const mensagemPadrao = `Olá! Vi o ${lead.nome}${lead.cidade ? ` em ${lead.cidade}/${lead.uf}` : ""} e gostaria de conversar sobre uma solução que pode ajudar seu negócio.`;

  const whatsappHref = lead.whatsapp
    ? (lead.whatsapp.startsWith("http")
        ? `${lead.whatsapp}${lead.whatsapp.includes("?") ? "&" : "?"}text=${encodeURIComponent(mensagemPadrao)}`
        : `https://wa.me/${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensagemPadrao)}`)
    : lead.telefone
      ? `https://wa.me/${lead.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagemPadrao)}`
      : null;

  const emailHref = lead.email
    ? `mailto:${lead.email}?subject=${encodeURIComponent(`Contato — ${lead.nome}`)}&body=${encodeURIComponent(mensagemPadrao)}`
    : null;

  const instagramHref = lead.instagram
    ? (lead.instagram.startsWith("http") ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`)
    : null;

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 transition ${selecionado ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
      <Checkbox checked={selecionado} onCheckedChange={onToggle} className="mt-1" />
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <div className="font-semibold text-base truncate">{lead.nome}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
              {lead.categoria && <Badge variant="secondary" className="text-[10px]">{lead.categoria}</Badge>}
              {lead.cidade && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />{lead.cidade}/{lead.uf}
                </span>
              )}
              {lead.avaliacao != null && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {lead.avaliacao.toFixed(1)} ({lead.total_avaliacoes ?? 0} avaliações)
                </span>
              )}
              <span className="text-muted-foreground/70">
                · capturado {formatDistanceToNow(new Date(lead.capturado_em), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < lead.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            ))}
            {lead.enviado_crm && <Badge variant="outline" className="ml-1 text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">CRM</Badge>}
          </div>
        </div>

        {/* Detalhes */}
        {lead.endereco && (
          <div className="text-xs text-muted-foreground flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{lead.endereco}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {lead.telefone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3 h-3" />
              <a href={`tel:${lead.telefone}`} className="hover:text-primary truncate">{lead.telefone}</a>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="w-3 h-3" />
              <a href={`mailto:${lead.email}`} className="hover:text-primary truncate">{lead.email}</a>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="w-3 h-3" />
              <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-primary truncate">{lead.website.replace(/^https?:\/\//, "")}</a>
            </div>
          )}
          {lead.google_maps_url && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <a href={lead.google_maps_url} target="_blank" rel="noreferrer" className="hover:text-primary truncate">Google Maps</a>
            </div>
          )}
          {lead.facebook && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Facebook className="w-3 h-3" />
              <a href={lead.facebook} target="_blank" rel="noreferrer" className="hover:text-primary truncate">Facebook</a>
            </div>
          )}
          {lead.linkedin && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Linkedin className="w-3 h-3" />
              <a href={lead.linkedin} target="_blank" rel="noreferrer" className="hover:text-primary truncate">LinkedIn</a>
            </div>
          )}
        </div>

        {/* Ações principais */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            asChild={!!emailHref}
            size="sm"
            variant="outline"
            disabled={!emailHref}
            className={emailHref ? "border-blue-500/40 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700" : ""}
          >
            {emailHref ? (
              <a href={emailHref}><Mail className="w-3.5 h-3.5 mr-1.5" />E-mail</a>
            ) : (
              <span><Mail className="w-3.5 h-3.5 mr-1.5" />E-mail</span>
            )}
          </Button>
          <Button
            asChild={!!whatsappHref}
            size="sm"
            variant="outline"
            disabled={!whatsappHref}
            className={whatsappHref ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700" : ""}
          >
            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle className="w-3.5 h-3.5 mr-1.5" />WhatsApp</a>
            ) : (
              <span><MessageCircle className="w-3.5 h-3.5 mr-1.5" />WhatsApp</span>
            )}
          </Button>
          <Button
            asChild={!!instagramHref}
            size="sm"
            variant="outline"
            disabled={!instagramHref}
            className={instagramHref ? "border-pink-500/40 text-pink-600 hover:bg-pink-500/10 hover:text-pink-700" : ""}
          >
            {instagramHref ? (
              <a href={instagramHref} target="_blank" rel="noreferrer"><Instagram className="w-3.5 h-3.5 mr-1.5" />Instagram</a>
            ) : (
              <span><Instagram className="w-3.5 h-3.5 mr-1.5" />Instagram</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Utils
// ============================================================================

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Aba: Automação diária
// ============================================================================

function AutomacaoTab() {
  const qc = useQueryClient();
  const getCatalogoFn = useServerFn(getCatalogo);
  const getCfgFn = useServerFn(getAutoConfig);
  const salvarFn = useServerFn(salvarAutoConfig);
  const rodarAgoraFn = useServerFn(executarAutoScraperAgora);

  const catalogoQ = useQuery({
    queryKey: ["scraper-catalogo"],
    queryFn: () => getCatalogoFn(),
  });
  const cfgQ = useQuery({
    queryKey: ["scraper-auto-config"],
    queryFn: () => getCfgFn(),
  });

  const sistemas: Sistema[] = (catalogoQ.data?.sistemas ?? []) as Sistema[];

  const [ativo, setAtivo] = useState(false);
  const [sistemasIds, setSistemasIds] = useState<Set<string>>(new Set());
  const [ufs, setUfs] = useState<Set<string>>(new Set());
  const [scoreMin, setScoreMin] = useState(3);
  const [enriquecer, setEnriquecer] = useState(true);
  const [limite, setLimite] = useState(15);
  const [hidratado, setHidratado] = useState(false);

  // hidrata form quando a config chega
  if (!hidratado && cfgQ.data) {
    const c = cfgQ.data as any;
    setAtivo(Boolean(c.ativo));
    setSistemasIds(new Set(c.sistemas_ids ?? []));
    setUfs(new Set((c.ufs ?? []).map((u: string) => u.toUpperCase())));
    setScoreMin(c.score_min ?? 3);
    setEnriquecer(c.enriquecer ?? true);
    setLimite(c.limite_por_busca ?? 15);
    setHidratado(true);
  }

  const salvarM = useMutation({
    mutationFn: () =>
      salvarFn({
        data: {
          id: (cfgQ.data as any)?.id,
          ativo,
          sistemas_ids: Array.from(sistemasIds),
          ufs: Array.from(ufs),
          score_min: scoreMin,
          enriquecer,
          limite_por_busca: limite,
        },
      }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      qc.invalidateQueries({ queryKey: ["scraper-auto-config"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar"),
  });

  const rodarM = useMutation({
    mutationFn: () => rodarAgoraFn({}),
    onSuccess: (r: any) => {
      if (r.status === "ok") {
        toast.success(
          `Rodada concluída em ${r.uf}. Válidos: ${r.contadores?.validos ?? 0} · Enviados ao CRM: ${r.encaminhados_crm ?? 0}.`,
        );
      } else {
        toast.info(`Rodada pulada: ${r.motivo ?? "sem motivo"}`);
      }
      qc.invalidateQueries({ queryKey: ["scraper-auto-config"] });
      qc.invalidateQueries({ queryKey: ["scraper-buscas"] });
      qc.invalidateQueries({ queryKey: ["scraper-leads"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao executar"),
  });

  if (cfgQ.isLoading || catalogoQ.isLoading) return <Skeleton className="h-64 w-full mt-4" />;

  const ultimaExec = (cfgQ.data as any)?.ultima_execucao as string | null;
  const ultimoUf = (cfgQ.data as any)?.ultimo_uf as string | null;
  const ultimoSis = (cfgQ.data as any)?.ultimo_sistema_id as string | null;
  const ultimoSisNome = sistemas.find((s) => s.id === ultimoSis)?.nome ?? null;

  return (
    <div className="grid md:grid-cols-3 gap-4 mt-4">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="w-4 h-4 text-primary" /> Robô de prospecção diária
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Todo dia o robô roda 1 busca alternando entre estados e sistemas, e envia automaticamente
            para <b>CRM → Leads</b> os contatos com nota igual ou acima do mínimo.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium text-sm">Automação ativa</div>
              <div className="text-xs text-muted-foreground">
                Liga/desliga o agendamento diário.
              </div>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </label>

          <div className="space-y-2">
            <Label>Sistemas participantes do rodízio</Label>
            <div className="grid sm:grid-cols-2 gap-2 border rounded-md p-3">
              {sistemas.map((s) => {
                const on = sistemasIds.has(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={on}
                      onCheckedChange={(v) => {
                        const next = new Set(sistemasIds);
                        if (v) next.add(s.id); else next.delete(s.id);
                        setSistemasIds(next);
                      }}
                    />
                    <span>{s.nome}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estados participantes do rodízio</Label>
            <div className="flex flex-wrap gap-1.5 border rounded-md p-3">
              {UF_LIST.map((u) => {
                const on = ufs.has(u);
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      const next = new Set(ufs);
                      if (on) next.delete(u); else next.add(u);
                      setUfs(next);
                    }}
                    className={`px-2 py-1 rounded text-xs border transition ${
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              O robô alterna diariamente entre as combinações de estado × sistema selecionados.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nota mínima para enviar ao CRM (0–5)</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={scoreMin}
                onChange={(e) => setScoreMin(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. resultados por termo (1–20)</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={limite}
                onChange={(e) => setLimite(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={enriquecer} onCheckedChange={(v) => setEnriquecer(Boolean(v))} />
            Visitar o site das empresas para capturar e-mail e redes sociais
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => salvarM.mutate()} disabled={salvarM.isPending}>
              {salvarM.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Salvar configuração
            </Button>
            <Button variant="outline" onClick={() => rodarM.mutate()} disabled={rodarM.isPending || !ativo}>
              {rodarM.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Rodar 1 ciclo agora
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="w-4 h-4 text-primary" /> Estado do rodízio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Última execução</div>
            <div className="font-medium">
              {ultimaExec
                ? `${formatDistanceToNow(new Date(ultimaExec), { locale: ptBR, addSuffix: true })}`
                : "Nunca executado"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Último alvo</div>
            <div className="font-medium">
              {ultimoUf && ultimoSisNome ? `${ultimoSisNome} · ${ultimoUf}` : "—"}
            </div>
          </div>
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            <div><b>Como funciona:</b></div>
            <div>1. Todo dia o cron dispara o robô.</div>
            <div>2. Ele escolhe a próxima combinação de UF × sistema.</div>
            <div>3. Roda a busca na maior cidade daquela UF.</div>
            <div>4. Leads com nota ≥ mínimo e contato válido vão direto para <b>CRM → Leads</b>.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
