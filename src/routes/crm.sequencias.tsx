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
import { Plus, Workflow, Trash2, ChevronRight, MessageCircle, Instagram, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/crm/sequencias")({
  head: () => ({ meta: [{ title: "Sequências · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SequenciasPage,
});

type Sequencia = { id: string; nome: string; descricao: string | null; ativo: boolean };
type Passo = { id: string; sequencia_id: string; ordem: number; dia: number; canal: string; conteudo: string | null; condicao: string | null };

const canalIcon = { whatsapp: MessageCircle, instagram: Instagram, email: Mail, ligacao: Phone } as const;
const canais = ["whatsapp", "instagram", "email", "ligacao"] as const;

function SequenciasPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "" });

  const seqQ = useQuery({
    queryKey: ["crm_sequencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_sequencias").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Sequencia[];
    },
  });

  const passosQ = useQuery({
    queryKey: ["crm_sequencia_passos", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_sequencia_passos").select("*").eq("sequencia_id", selected!).order("ordem");
      if (error) throw error;
      return data as Passo[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.nome) throw new Error("Nome obrigatório");
      const { data, error } = await supabase.from("crm_sequencias").insert({ nome: form.nome, descricao: form.descricao || null }).select().single();
      if (error) throw error;
      return data as Sequencia;
    },
    onSuccess: (row) => { toast.success("Sequência criada"); setOpenNew(false); setForm({ nome: "", descricao: "" }); setSelected(row.id); qc.invalidateQueries({ queryKey: ["crm_sequencias"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleAtivo = useMutation({
    mutationFn: async (s: Sequencia) => {
      const { error } = await supabase.from("crm_sequencias").update({ ativo: !s.ativo }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_sequencias"] }),
  });

  const addPasso = useMutation({
    mutationFn: async () => {
      const ordem = (passosQ.data?.length ?? 0) + 1;
      const dia = ordem === 1 ? 1 : (passosQ.data!.at(-1)!.dia + 2);
      const { error } = await supabase.from("crm_sequencia_passos").insert({ sequencia_id: selected!, ordem, dia, canal: "whatsapp", conteudo: "" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_sequencia_passos", selected] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePasso = useMutation({
    mutationFn: async (p: Partial<Passo> & { id: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from("crm_sequencia_passos").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_sequencia_passos", selected] }),
  });

  const delPasso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_sequencia_passos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_sequencia_passos", selected] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sequências</h1>
          <p className="text-sm text-muted-foreground">Cadências multi-canal (WhatsApp, Instagram, Email, Ligação).</p>
        </div>
        <Button onClick={() => setOpenNew(true)}><Plus className="mr-2 h-4 w-4" />Nova sequência</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Card>
          <CardContent className="p-0">
            {seqQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
              (seqQ.data?.length ?? 0) === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma sequência.</div> :
              <div className="divide-y">
                {seqQ.data!.map((s) => (
                  <button key={s.id} onClick={() => setSelected(s.id)} className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40 ${selected === s.id ? "bg-muted/60" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">{s.nome}</span>
                      </div>
                      {s.descricao && <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.descricao}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.ativo ? "default" : "secondary"} className="text-[10px]">{s.ativo ? "ativa" : "off"}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            {!selected ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Selecione uma sequência para editar os passos.</div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const s = seqQ.data?.find((x) => x.id === selected);
                  if (!s) return null;
                  return (
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h2 className="text-lg font-semibold">{s.nome}</h2>
                        <p className="text-xs text-muted-foreground">{s.descricao || "Sem descrição"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAtivo.mutate(s)}>{s.ativo ? "Pausar" : "Ativar"}</Button>
                        <Button size="sm" onClick={() => addPasso.mutate()}><Plus className="mr-1 h-3.5 w-3.5" />Passo</Button>
                      </div>
                    </div>
                  );
                })()}
                {passosQ.isLoading ? <Skeleton className="h-40" /> :
                  (passosQ.data?.length ?? 0) === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Nenhum passo. Clique em "Passo" para adicionar.</div> :
                  <div className="space-y-2">
                    {passosQ.data!.map((p) => {
                      const Icon = canalIcon[p.canal as keyof typeof canalIcon] ?? MessageCircle;
                      return (
                        <div key={p.id} className="rounded-lg border bg-card p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">#{p.ordem}</Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Label className="text-xs">Dia</Label>
                              <Input type="number" className="h-7 w-16" value={p.dia} onChange={(e) => updatePasso.mutate({ id: p.id, dia: Number(e.target.value) })} />
                            </div>
                            <Select value={p.canal} onValueChange={(v) => updatePasso.mutate({ id: p.id, canal: v })}>
                              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{canais.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => delPasso.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                          <Textarea placeholder="Conteúdo da mensagem (use variáveis {empresa}, {categoria})" value={p.conteudo ?? ""} onChange={(e) => updatePasso.mutate({ id: p.id, conteudo: e.target.value })} rows={3} className="text-sm" />
                        </div>
                      );
                    })}
                  </div>
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova sequência</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
