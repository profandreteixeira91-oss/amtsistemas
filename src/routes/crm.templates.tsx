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
import { Plus, FileText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/crm/templates")({
  head: () => ({ meta: [{ title: "Templates · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: TemplatesPage,
});

type Template = { id: string; nome: string; canal: string; assunto: string | null; conteudo: string; tom: string | null; ativo: boolean };
const canais = ["whatsapp", "email", "instagram", "ligacao"];

function TemplatesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<Template | null>(null);
  const [form, setForm] = useState<Partial<Template>>({ nome: "", canal: "whatsapp", assunto: "", conteudo: "", tom: "consultivo", ativo: true });

  const q = useQuery({
    queryKey: ["crm_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_templates_mensagem").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nome || !form.conteudo) throw new Error("Nome e conteúdo obrigatórios");
      if (open) {
        const { error } = await supabase.from("crm_templates_mensagem").update(form as any).eq("id", open.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_templates_mensagem").insert(form as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo"); setOpen(null); setForm({ nome: "", canal: "whatsapp", assunto: "", conteudo: "", tom: "consultivo", ativo: true }); qc.invalidateQueries({ queryKey: ["crm_templates"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_templates_mensagem").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["crm_templates"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates de mensagem</h1>
          <p className="text-sm text-muted-foreground">Reutilizados por sequências e automações.</p>
        </div>
        <Button onClick={() => { setOpen({ id: "" } as Template); setForm({ nome: "", canal: "whatsapp", assunto: "", conteudo: "", tom: "consultivo", ativo: true }); }}>
          <Plus className="mr-2 h-4 w-4" />Novo template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (q.data?.length ?? 0) === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum template. Crie o primeiro.</div> :
            <div className="divide-y">
              {q.data!.map((t) => (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                  <FileText className="mt-1 h-4 w-4 text-muted-foreground" />
                  <button onClick={() => { setOpen(t); setForm(t); }} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.nome}</span>
                      <Badge variant="outline" className="text-[10px]">{t.canal}</Badge>
                      {t.tom && <Badge variant="secondary" className="text-[10px]">{t.tom}</Badge>}
                      {!t.ativo && <Badge variant="secondary" className="text-[10px]">off</Badge>}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.conteudo}</p>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{open?.id ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div>
                <Label>Canal</Label>
                <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{canais.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {form.canal === "email" && (
              <div><Label>Assunto</Label><Input value={form.assunto ?? ""} onChange={(e) => setForm({ ...form, assunto: e.target.value })} /></div>
            )}
            <div><Label>Conteúdo (use {"{empresa}"}, {"{nome}"}, {"{categoria}"})</Label>
              <Textarea rows={6} value={form.conteudo ?? ""} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
            </div>
            <div><Label>Tom</Label><Input value={form.tom ?? ""} onChange={(e) => setForm({ ...form, tom: e.target.value })} placeholder="consultivo, direto, casual…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
