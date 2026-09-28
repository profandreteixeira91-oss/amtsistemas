import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, CheckCircle2, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos")({
  head: () => ({ meta: [{ title: "Contratos · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ContratosPage,
});

type Contrato = { id: string; numero: number; titulo: string; conteudo: string | null; status: string; assinado_em: string | null; proposta_id: string | null; cliente_id: string | null; created_at: string };
type Proposta = { id: string; numero: number; titulo: string; valor_setup: number; valor_mensal: number; status: string };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ContratosPage() {
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [openView, setOpenView] = useState<Contrato | null>(null);
  const [form, setForm] = useState({ titulo: "", proposta_id: "", conteudo: "" });

  const contratosQ = useQuery({
    queryKey: ["crm_contratos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_contratos").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as Contrato[];
    },
  });

  const propostasQ = useQuery({
    queryKey: ["crm_propostas_aceitas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_propostas").select("id, numero, titulo, valor_setup, valor_mensal, status").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Proposta[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.titulo) throw new Error("Título obrigatório");
      const proposta = propostasQ.data?.find((p) => p.id === form.proposta_id);
      const conteudoFinal = form.conteudo || (proposta
        ? `CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nProposta #${proposta.numero} — ${proposta.titulo}\n\nValor de setup: ${brl(Number(proposta.valor_setup))}\nMensalidade: ${brl(Number(proposta.valor_mensal))}\n\nCondições padrão AMT Sistemas.`
        : `CONTRATO — ${form.titulo}`);
      const { error } = await supabase.from("crm_contratos").insert({
        titulo: form.titulo, proposta_id: form.proposta_id || null, conteudo: conteudoFinal, status: "rascunho",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contrato criado"); setOpenNew(false); setForm({ titulo: "", proposta_id: "", conteudo: "" }); qc.invalidateQueries({ queryKey: ["crm_contratos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const marcarAssinado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_contratos").update({ status: "assinado", assinado_em: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contrato assinado"); qc.invalidateQueries({ queryKey: ["crm_contratos"] }); setOpenView(null); },
  });

  const download = (c: Contrato) => {
    const blob = new Blob([`${c.titulo}\n\n${c.conteudo ?? ""}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `contrato-${c.numero}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">Gerados a partir de propostas aceitas.</p>
        </div>
        <Button onClick={() => setOpenNew(true)}><Plus className="mr-2 h-4 w-4" />Novo contrato</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {contratosQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (contratosQ.data?.length ?? 0) === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum contrato ainda.</div> :
            <div className="divide-y">
              {contratosQ.data!.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <button onClick={() => setOpenView(c)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="outline" className="text-[10px]">#{c.numero}</Badge>
                      <span className="truncate font-medium">{c.titulo}</span>
                      <Badge variant={c.status === "assinado" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}{c.assinado_em && ` · assinado em ${new Date(c.assinado_em).toLocaleDateString("pt-BR")}`}</div>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => download(c)}><Download className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo contrato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div>
              <Label>Vincular proposta (opcional)</Label>
              <Select value={form.proposta_id} onValueChange={(v) => setForm({ ...form, proposta_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>{propostasQ.data?.map((p) => <SelectItem key={p.id} value={p.id}>#{p.numero} · {p.titulo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Conteúdo (deixe vazio para gerar do template)</Label><Textarea rows={8} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openView} onOpenChange={(o) => !o && setOpenView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{openView && `#${openView.numero} · ${openView.titulo}`}</DialogTitle></DialogHeader>
          {openView && <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-xs">{openView.conteudo}</pre>}
          <DialogFooter>
            {openView && <Button variant="outline" onClick={() => download(openView)}><Download className="mr-2 h-4 w-4" />Baixar</Button>}
            {openView && openView.status !== "assinado" && <Button onClick={() => marcarAssinado.mutate(openView.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Marcar como assinado</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
