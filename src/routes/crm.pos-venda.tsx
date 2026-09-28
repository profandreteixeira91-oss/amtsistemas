import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardCheck, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/crm/pos-venda")({
  head: () => ({ meta: [{ title: "Pós-venda · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PosVendaPage,
});

type Etapa = { nome: string; feito: boolean; obs?: string };
type Checklist = { id: string; cliente_id: string | null; status: string; etapas: Etapa[]; observacoes: string | null; concluido_em: string | null; created_at: string };
type Cliente = { id: string; razao_social: string | null; nome_fantasia: string | null };

const ETAPAS_PADRAO: Etapa[] = [
  { nome: "Implantação inicial", feito: false },
  { nome: "Treinamento da equipe", feito: false },
  { nome: "Primeiro acesso do cliente", feito: false },
  { nome: "Migração de dados", feito: false },
  { nome: "Suporte semana 1", feito: false },
  { nome: "Conclusão e handoff", feito: false },
];

function PosVendaPage() {
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [openView, setOpenView] = useState<Checklist | null>(null);
  const [form, setForm] = useState({ cliente_id: "" });

  const listQ = useQuery({
    queryKey: ["crm_checklists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_checklist_implantacao").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ ...r, etapas: (r.etapas as Etapa[]) ?? [] })) as Checklist[];
    },
  });

  const clientesQ = useQuery({
    queryKey: ["manager_clientes_lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_clientes").select("id, razao_social, nome_fantasia").order("razao_social").limit(200);
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.cliente_id) throw new Error("Cliente obrigatório");
      const { error } = await supabase.from("crm_checklist_implantacao").insert({ cliente_id: form.cliente_id, etapas: ETAPAS_PADRAO, status: "andamento" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checklist criado"); setOpenNew(false); setForm({ cliente_id: "" }); qc.invalidateQueries({ queryKey: ["crm_checklists"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEtapas = useMutation({
    mutationFn: async ({ id, etapas }: { id: string; etapas: Etapa[] }) => {
      const todosFeitos = etapas.every((e) => e.feito);
      const patch: any = { etapas };
      if (todosFeitos) { patch.status = "concluido"; patch.concluido_em = new Date().toISOString(); }
      else { patch.status = "andamento"; patch.concluido_em = null; }
      const { error } = await supabase.from("crm_checklist_implantacao").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_checklists"] }),
  });

  const clienteNome = (id: string | null) => {
    const c = clientesQ.data?.find((x) => x.id === id);
    return c ? (c.nome_fantasia || c.razao_social || "—") : "—";
  };
  const progresso = (etapas: Etapa[]) => etapas.length ? Math.round(etapas.filter((e) => e.feito).length / etapas.length * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pós-venda</h1>
          <p className="text-sm text-muted-foreground">Checklists de implantação por cliente.</p>
        </div>
        <Button onClick={() => setOpenNew(true)}><Plus className="mr-2 h-4 w-4" />Novo checklist</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {listQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (listQ.data?.length ?? 0) === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum checklist ativo.</div> :
            <div className="divide-y">
              {listQ.data!.map((c) => {
                const p = progresso(c.etapas);
                return (
                  <button key={c.id} onClick={() => setOpenView(c)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/40">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{clienteNome(c.cliente_id)}</span>
                        <Badge variant={c.status === "concluido" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                      </div>
                      <div className="mt-1 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{p}%</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo checklist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente…" /></SelectTrigger>
                <SelectContent>{clientesQ.data?.map((c) => {
                  const label = c.nome_fantasia || c.razao_social || "Sem nome";
                  const extra = c.nome_fantasia && c.razao_social && c.nome_fantasia !== c.razao_social ? ` · ${c.razao_social}` : "";
                  return <SelectItem key={c.id} value={c.id}>{label}{extra}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{ETAPAS_PADRAO.length} etapas padrão serão criadas.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openView} onOpenChange={(o) => !o && setOpenView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{openView && clienteNome(openView.cliente_id)}</DialogTitle></DialogHeader>
          {openView && (
            <div className="space-y-2">
              {openView.etapas.map((e, i) => (
                <label key={i} className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40">
                  <Checkbox checked={e.feito} onCheckedChange={(v) => {
                    const nova = [...openView.etapas];
                    nova[i] = { ...e, feito: !!v };
                    setOpenView({ ...openView, etapas: nova });
                    updateEtapas.mutate({ id: openView.id, etapas: nova });
                  }} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${e.feito ? "text-muted-foreground line-through" : ""}`}>{e.nome}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
