import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, DollarSign, Trophy, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/crm/oportunidades")({
  component: CrmPage,
});

type Oportunidade = {
  id: string;
  titulo: string;
  lead_id: string | null;
  cliente_id: string | null;
  sistema_id: string | null;
  plano_id: string | null;
  estagio: string;
  valor: number;
  probabilidade: number;
  previsao_fechamento: string | null;
  motivo_perda: string | null;
  observacoes: string | null;
};

type Ref = { id: string; nome: string };
type PlanoRef = { id: string; nome: string; sistema_id: string };

const ESTAGIOS = [
  { value: "prospeccao", label: "Prospecção", color: "border-t-blue-500" },
  { value: "qualificacao", label: "Qualificação", color: "border-t-indigo-500" },
  { value: "proposta", label: "Proposta", color: "border-t-purple-500" },
  { value: "negociacao", label: "Negociação", color: "border-t-amber-500" },
  { value: "ganha", label: "Ganha", color: "border-t-emerald-500" },
  { value: "perdida", label: "Perdida", color: "border-t-rose-500" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function emptyForm() {
  return {
    titulo: "",
    lead_id: "",
    cliente_id: "",
    sistema_id: "",
    plano_id: "",
    estagio: "prospeccao",
    valor: 0,
    probabilidade: 20,
    previsao_fechamento: "",
    motivo_perda: "",
    observacoes: "",
  };
}

function CrmPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Oportunidade | null>(null);
  const [form, setForm] = useState(emptyForm());

  const oportQ = useQuery({
    queryKey: ["manager_oportunidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_oportunidades").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Oportunidade[];
    },
  });

  const leadsQ = useQuery({
    queryKey: ["manager_leads_lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_leads").select("id,nome").order("nome");
      if (error) throw error;
      return data as Ref[];
    },
  });

  const clientesQ = useQuery({
    queryKey: ["manager_clientes_lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_clientes").select("id,razao_social,nome_fantasia").order("razao_social");
      if (error) throw error;
      return (data ?? []).map((c) => ({ id: c.id, nome: c.nome_fantasia || c.razao_social })) as Ref[];
    },
  });

  const sistemasQ = useQuery({
    queryKey: ["manager_sistemas_lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_sistemas").select("id,nome").order("nome");
      if (error) throw error;
      return data as Ref[];
    },
  });

  const planosQ = useQuery({
    queryKey: ["manager_planos_lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_planos").select("id,nome,sistema_id").order("nome");
      if (error) throw error;
      return data as PlanoRef[];
    },
  });

  const kpis = useMemo(() => {
    const list = oportQ.data ?? [];
    const abertas = list.filter((o) => !["ganha", "perdida"].includes(o.estagio));
    const ganhas = list.filter((o) => o.estagio === "ganha");
    const perdidas = list.filter((o) => o.estagio === "perdida");
    return {
      pipeline: abertas.reduce((a, o) => a + Number(o.valor), 0),
      ponderado: abertas.reduce((a, o) => a + (Number(o.valor) * o.probabilidade) / 100, 0),
      ganho: ganhas.reduce((a, o) => a + Number(o.valor), 0),
      perdido: perdidas.reduce((a, o) => a + Number(o.valor), 0),
      countGanhas: ganhas.length,
      countPerdidas: perdidas.length,
    };
  }, [oportQ.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        titulo: form.titulo.trim(),
        lead_id: form.lead_id || null,
        cliente_id: form.cliente_id || null,
        sistema_id: form.sistema_id || null,
        plano_id: form.plano_id || null,
        estagio: form.estagio,
        valor: Number(form.valor) || 0,
        probabilidade: Number(form.probabilidade) || 0,
        previsao_fechamento: form.previsao_fechamento || null,
        motivo_perda: form.motivo_perda || null,
        observacoes: form.observacoes || null,
        fechada_em: ["ganha", "perdida"].includes(form.estagio) ? new Date().toISOString() : null,
      };
      if (!payload.titulo) throw new Error("Título é obrigatório");
      if (editing) {
        const { error } = await supabase.from("manager_oportunidades").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("manager_oportunidades").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Oportunidade atualizada" : "Oportunidade criada");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm());
      qc.invalidateQueries({ queryKey: ["manager_oportunidades"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, estagio }: { id: string; estagio: string }) => {
      const patch: { estagio: string; fechada_em?: string | null } = { estagio };
      if (["ganha", "perdida"].includes(estagio)) patch.fechada_em = new Date().toISOString();
      const { error } = await supabase.from("manager_oportunidades").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manager_oportunidades"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manager_oportunidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida");
      qc.invalidateQueries({ queryKey: ["manager_oportunidades"] });
    },
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(o: Oportunidade) {
    setEditing(o);
    setForm({
      titulo: o.titulo,
      lead_id: o.lead_id ?? "",
      cliente_id: o.cliente_id ?? "",
      sistema_id: o.sistema_id ?? "",
      plano_id: o.plano_id ?? "",
      estagio: o.estagio,
      valor: Number(o.valor),
      probabilidade: o.probabilidade,
      previsao_fechamento: o.previsao_fechamento ?? "",
      motivo_perda: o.motivo_perda ?? "",
      observacoes: o.observacoes ?? "",
    });
    setOpen(true);
  }

  const grouped = useMemo(() => {
    const list = oportQ.data ?? [];
    return ESTAGIOS.map((e) => ({
      ...e,
      items: list.filter((o) => o.estagio === e.value),
      total: list.filter((o) => o.estagio === e.value).reduce((a, o) => a + Number(o.valor), 0),
    }));
  }, [oportQ.data]);

  const planosFiltrados = form.sistema_id
    ? (planosQ.data ?? []).filter((p) => p.sistema_id === form.sistema_id)
    : (planosQ.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">CRM · Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground">Oportunidades em kanban por estágio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => oportQ.refetch()} disabled={oportQ.isFetching}>
            <RefreshCw className={`h-4 w-4 ${oportQ.isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova Oportunidade</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Pipeline aberto</div>
          <div className="text-xl font-semibold mt-1">{brl(kpis.pipeline)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Ponderado</div>
          <div className="text-xl font-semibold mt-1">{brl(kpis.ponderado)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="h-3.5 w-3.5" /> Ganho ({kpis.countGanhas})</div>
          <div className="text-xl font-semibold mt-1 text-emerald-600">{brl(kpis.ganho)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> Perdido ({kpis.countPerdidas})</div>
          <div className="text-xl font-semibold mt-1 text-rose-600">{brl(kpis.perdido)}</div>
        </CardContent></Card>
      </div>

      {oportQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {grouped.map((col) => (
            <Card key={col.value} className={`border-t-4 ${col.color}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{col.label}</span>
                  <Badge variant="secondary">{col.items.length}</Badge>
                </CardTitle>
                <div className="text-xs text-muted-foreground">{brl(col.total)}</div>
              </CardHeader>
              <CardContent className="space-y-2 min-h-40">
                {col.items.map((o) => (
                  <div key={o.id} className="rounded-md border bg-card p-2.5 text-sm space-y-1.5 hover:shadow-sm transition">
                    <div className="font-medium leading-tight">{o.titulo}</div>
                    <div className="text-xs text-muted-foreground">{brl(Number(o.valor))} • {o.probabilidade}%</div>
                    <div className="flex items-center gap-1 pt-1">
                      <Select value={o.estagio} onValueChange={(v) => moveMut.mutate({ id: o.id, estagio: v })}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{ESTAGIOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Remover?</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => delMut.mutate(o.id)}>Remover</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">—</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
            <DialogDescription>Vincule lead, cliente, sistema e plano.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div>
              <Label>Lead</Label>
              <Select value={form.lead_id || "none"} onValueChange={(v) => setForm({ ...form, lead_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{(leadsQ.data ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.cliente_id || "none"} onValueChange={(v) => setForm({ ...form, cliente_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{(clientesQ.data ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sistema</Label>
              <Select value={form.sistema_id || "none"} onValueChange={(v) => setForm({ ...form, sistema_id: v === "none" ? "" : v, plano_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{(sistemasQ.data ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plano</Label>
              <Select value={form.plano_id || "none"} onValueChange={(v) => setForm({ ...form, plano_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{planosFiltrados.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estágio</Label>
              <Select value={form.estagio} onValueChange={(v) => setForm({ ...form, estagio: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTAGIOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></div>
            <div><Label>Probabilidade (%)</Label><Input type="number" min={0} max={100} value={form.probabilidade} onChange={(e) => setForm({ ...form, probabilidade: Number(e.target.value) })} /></div>
            <div><Label>Previsão fechamento</Label><Input type="date" value={form.previsao_fechamento} onChange={(e) => setForm({ ...form, previsao_fechamento: e.target.value })} /></div>
            {form.estagio === "perdida" && (
              <div className="col-span-2"><Label>Motivo da perda</Label><Input value={form.motivo_perda} onChange={(e) => setForm({ ...form, motivo_perda: e.target.value })} /></div>
            )}
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>{saveMut.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
