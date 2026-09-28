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
import { Plus } from "lucide-react";

export const Route = createFileRoute("/crm/propostas")({
  head: () => ({ meta: [{ title: "Propostas · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PropostasPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PropostasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", valor_setup: 0, valor_mensal: 0, observacoes: "" });

  const q = useQuery({
    queryKey: ["crm_propostas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_propostas").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Array<{ id: string; numero: number; titulo: string; valor_setup: number; valor_mensal: number; status: string }>;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.titulo) throw new Error("Título obrigatório");
      const { error } = await supabase.from("crm_propostas").insert({
        titulo: form.titulo, valor_setup: form.valor_setup, valor_mensal: form.valor_mensal, observacoes: form.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proposta criada"); setOpen(false); setForm({ titulo: "", valor_setup: 0, valor_mensal: 0, observacoes: "" }); qc.invalidateQueries({ queryKey: ["crm_propostas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">Comerciais com setup + mensalidade.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (q.data?.length ?? 0) === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma proposta.</div> :
            <div className="divide-y">
              {q.data!.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">#{p.numero}</Badge>
                      <span className="font-medium">{p.titulo}</span>
                      <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Setup {brl(Number(p.valor_setup))} · Mensal {brl(Number(p.valor_mensal))}</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova proposta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Setup (R$)</Label><Input type="number" step="0.01" value={form.valor_setup} onChange={(e) => setForm({ ...form, valor_setup: Number(e.target.value) })} /></div>
              <div><Label>Mensal (R$)</Label><Input type="number" step="0.01" value={form.valor_mensal} onChange={(e) => setForm({ ...form, valor_mensal: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
