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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar as CalIcon } from "lucide-react";

export const Route = createFileRoute("/crm/agenda")({
  head: () => ({ meta: [{ title: "Agenda · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "reuniao", inicio: "", fim: "", observacoes: "" });

  const q = useQuery({
    queryKey: ["crm_agenda"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_agenda").select("*").order("inicio", { ascending: true }).limit(100);
      if (error) throw error;
      return data as Array<{ id: string; titulo: string; tipo: string; inicio: string; fim: string | null; status: string; observacoes: string | null }>;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.titulo || !form.inicio) throw new Error("Título e início obrigatórios");
      const { error } = await supabase.from("crm_agenda").insert({
        titulo: form.titulo, tipo: form.tipo, inicio: form.inicio, fim: form.fim || null, observacoes: form.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Compromisso criado"); setOpen(false); setForm({ titulo: "", tipo: "reuniao", inicio: "", fim: "", observacoes: "" }); qc.invalidateQueries({ queryKey: ["crm_agenda"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Reuniões, retornos, treinamentos e callbacks.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (q.data?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Sem compromissos.</div>
            ) : (
              <div className="divide-y">
                {q.data!.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <CalIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{c.titulo}</div>
                      <div className="text-xs text-muted-foreground">{c.tipo} · {new Date(c.inicio).toLocaleString("pt-BR")}{c.fim && ` → ${new Date(c.fim).toLocaleString("pt-BR")}`}</div>
                    </div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.status}</span>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo compromisso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="demo">Demonstração</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="datetime-local" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} /></div>
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
