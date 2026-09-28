import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, TestTube2, CheckCircle2, XCircle, ExternalLink, KeyRound, Eye, EyeOff, Sparkles } from "lucide-react";
import { CATALOGO, PLANO_META, findDef, type IntegracaoDef, type CampoDef, type PlanoTipo } from "@/lib/crm/integracoes-catalogo";
import {
  salvarIntegracao,
  removerIntegracao,
  testarIntegracao,
} from "@/lib/crm/integracoes.functions";

const CAT_LABEL: Record<string, string> = {
  mensageria: "Mensageria",
  email: "Email",
  ia: "IA · Texto",
  ia_imagem: "IA · Imagem",
  google: "Google",
  meta: "Meta / Facebook",
  automacao: "Automação & Workflows",
  push: "Push / Notificações",
  sms: "SMS / Voz",
  storage: "Storage & Mídia",
  analytics: "Analytics",
  pagamento: "Pagamento",
  outros: "Outros",
};

const CAT_ORDER = [
  "ia", "ia_imagem", "mensageria", "email", "push", "sms",
  "google", "meta", "pagamento", "storage", "analytics", "automacao", "outros",
];

function CrmIntegracoesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<{ def: IntegracaoDef; row?: any } | null>(null);
  const [filtroPlano, setFiltroPlano] = useState<"todos" | PlanoTipo>("todos");
  const salvar = useServerFn(salvarIntegracao);
  const remover = useServerFn(removerIntegracao);
  const testar = useServerFn(testarIntegracao);

  const { data: rows } = useQuery({
    queryKey: ["crm-integracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("crm_integracoes").select("*").order("tipo");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const salvarMut = useMutation({
    mutationFn: (p: any) => salvar({ data: p }),
    onSuccess: () => { toast.success("Integração salva"); setOpen(null); qc.invalidateQueries({ queryKey: ["crm-integracoes"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const removerMut = useMutation({
    mutationFn: (id: string) => remover({ data: { id } }),
    onSuccess: () => { toast.success("Removida"); qc.invalidateQueries({ queryKey: ["crm-integracoes"] }); },
  });
  const testarMut = useMutation({
    mutationFn: (id: string) => testar({ data: { id } }),
    onSuccess: (r: any) => {
      if (r.ok) toast.success(`OK — ${r.mensagem}`);
      else toast.error(`Falha — ${r.mensagem}`);
      qc.invalidateQueries({ queryKey: ["crm-integracoes"] });
    },
  });

  const rowsByType: Record<string, any[]> = {};
  (rows ?? []).forEach((r) => { (rowsByType[r.tipo] ??= []).push(r); });

  const catByCat: Record<string, IntegracaoDef[]> = {};
  CATALOGO.forEach((d) => {
    if (filtroPlano !== "todos" && d.plano !== filtroPlano) return;
    (catByCat[d.categoria] ??= []).push(d);
  });

  const totais = {
    total: CATALOGO.length,
    gratis: CATALOGO.filter((c) => c.plano === "gratis").length,
    freemium: CATALOGO.filter((c) => c.plano === "freemium").length,
    pago: CATALOGO.filter((c) => c.plano === "pago").length,
  };

  const filtros: Array<{ v: "todos" | PlanoTipo; label: string; count: number }> = [
    { v: "todos", label: "Todas", count: totais.total },
    { v: "gratis", label: "Grátis", count: totais.gratis },
    { v: "freemium", label: "Freemium", count: totais.freemium },
    { v: "pago", label: "Pago", count: totais.pago },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrações & APIs</h1>
          <p className="text-sm text-muted-foreground">
            Configure todas as APIs consumidas pelo CRM. Cada integração indica se é <strong>Grátis</strong>, <strong>Freemium</strong> (camada gratuita + pagos) ou <strong>Pago</strong>.
            Priorize as gratuitas — sistema faz fallback automático quando uma provedora fica sem crédito.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroPlano(f.v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                filtroPlano === f.v ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              {f.v === "gratis" && <Sparkles className="h-3 w-3" />}
              {f.label}
              <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{f.count}</span>
            </button>
          ))}
        </div>
      </header>

      {CAT_ORDER.filter((c) => catByCat[c]?.length).map((cat) => {
        const defs = catByCat[cat];
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{CAT_LABEL[cat]}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {defs.map((def) => {
                const instancias = rowsByType[def.tipo] ?? [];
                const plano = PLANO_META[def.plano];
                return (
                  <Card key={def.tipo} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{def.label}</CardTitle>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className={`text-[10px] ${plano.className}`}>
                            {def.plano === "gratis" && <Sparkles className="mr-0.5 h-2.5 w-2.5" />}
                            {plano.label}
                          </Badge>
                          {instancias.some((i) => i.ativo) && (
                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 text-[10px]">Ativo</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{def.descricao}</p>
                      {def.plano_detalhe && (
                        <p className="text-[10px] italic text-muted-foreground/80">💡 {def.plano_detalhe}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2">
                      {instancias.map((row) => (
                        <div key={row.id} className="flex items-center gap-2 rounded-md border border-border/60 p-2 text-xs">
                          <KeyRound className={`h-3.5 w-3.5 ${row.ativo ? "text-emerald-500" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{row.nome}</p>
                            {row.ultimo_teste_status && (
                              <p className={`flex items-center gap-1 text-[10px] ${row.ultimo_teste_status === "ok" ? "text-emerald-600" : "text-destructive"}`}>
                                {row.ultimo_teste_status === "ok" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                                {row.ultimo_teste_mensagem?.slice(0, 60)}
                              </p>
                            )}
                          </div>
                          {def.testavel !== false && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => testarMut.mutate(row.id)} disabled={testarMut.isPending}>
                              <TestTube2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setOpen({ def, row })}>Editar</Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removerMut.mutate(row.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen({ def })}>
                        <Plus className="mr-1 h-3 w-3" /> {instancias.length ? "Adicionar conta" : "Configurar"}
                      </Button>
                      {def.docs && (
                        <a href={def.docs} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:underline">
                          <ExternalLink className="h-2.5 w-2.5" /> Documentação
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {open && (
        <Dialog open onOpenChange={(v) => { if (!v) setOpen(null); }}>
          <FormDialog def={open.def} row={open.row} onSubmit={(p) => salvarMut.mutate(p)} loading={salvarMut.isPending} />
        </Dialog>
      )}
    </div>
  );
}

function FormDialog({ def, row, onSubmit, loading }: { def: IntegracaoDef; row?: any; onSubmit: (p: any) => void; loading: boolean }) {
  const [nome, setNome] = useState(row?.nome ?? "Principal");
  const [creds, setCreds] = useState<Record<string, string>>(row?.credenciais ?? {});
  const [cfg, setCfg] = useState<Record<string, any>>(row?.config ?? {});
  const [ativo, setAtivo] = useState(row?.ativo ?? true);
  const [obs, setObs] = useState(row?.observacoes ?? "");

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{def.label}</DialogTitle>
        <p className="text-xs text-muted-foreground">{def.descricao}</p>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome desta conta</label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Principal" />
        </div>

        {def.credenciais.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credenciais</h3>
            {def.credenciais.map((c) => (
              <CampoInput key={c.key} def={c} value={creds[c.key] ?? ""} onChange={(v) => setCreds({ ...creds, [c.key]: v })} secret />
            ))}
          </section>
        )}

        {def.config && def.config.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações</h3>
            {def.config.map((c) => (
              <CampoInput key={c.key} def={c} value={cfg[c.key] ?? ""} onChange={(v) => setCfg({ ...cfg, [c.key]: v })} />
            ))}
          </section>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">Observações</label>
          <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={ativo} onCheckedChange={setAtivo} /> Ativo
        </label>
      </div>
      <DialogFooter>
        <Button
          disabled={loading}
          onClick={() => onSubmit({
            id: row?.id, tipo: def.tipo, nome, credenciais: creds, config: cfg, ativo, observacoes: obs || null,
          })}
        >Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CampoInput({ def, value, onChange, secret }: { def: CampoDef; value: any; onChange: (v: any) => void; secret?: boolean }) {
  const [show, setShow] = useState(false);
  const isSecret = secret && (def.tipo === "password" || (def.key.toLowerCase().includes("key") || def.key.toLowerCase().includes("token") || def.key.toLowerCase().includes("secret")));
  if (def.tipo === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={!!value} onCheckedChange={onChange} /> {def.label}
      </label>
    );
  }
  if (def.tipo === "textarea") {
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground">{def.label}{def.obrigatorio && " *"}</label>
        <Textarea rows={4} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} className="font-mono text-xs" />
        {def.ajuda && <p className="mt-1 text-[10px] text-muted-foreground">{def.ajuda}</p>}
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{def.label}{def.obrigatorio && " *"}</label>
      <div className="relative">
        <Input
          type={isSecret && !show ? "password" : "text"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
        {isSecret && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {def.ajuda && <p className="mt-1 text-[10px] text-muted-foreground">{def.ajuda}</p>}
    </div>
  );
}

export const Route = createFileRoute("/crm/integracoes")({
  head: () => ({ meta: [{ title: "Integrações · AMT CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CrmIntegracoesPage,
});
