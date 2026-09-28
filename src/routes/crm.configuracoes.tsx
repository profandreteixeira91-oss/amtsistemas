import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save } from "lucide-react";

export const Route = createFileRoute("/crm/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ConfigPage,
});

type Prompt = { id: string; chave: string; titulo: string; template: string; provider: string; modelo: string };

function ConfigPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [template, setTemplate] = useState("");
  const [modelo, setModelo] = useState("");

  const q = useQuery({
    queryKey: ["crm_prompts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_prompts_ia").select("*").order("chave");
      if (error) throw error;
      return data as Prompt[];
    },
  });

  const catQ = useQuery({
    queryKey: ["crm_categorias_lead"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_categorias_lead").select("*").order("grupo, nome");
      if (error) throw error;
      return data as Array<{ id: string; nome: string; grupo: string | null; ativo: boolean; buscas: string[] }>;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase.from("crm_prompts_ia").update({ template, modelo }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Prompt salvo"); qc.invalidateQueries({ queryKey: ["crm_prompts"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  function selecionar(p: Prompt) {
    setEditing(p); setTemplate(p.template); setModelo(p.modelo);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Prompts de IA, categorias, integrações, usuários e permissões.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> Prompts de IA</CardTitle>
          <CardDescription>Edite os prompts usados pelo CRM. Aceita variáveis no formato {`{variavel}`}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="space-y-1">
            {q.isLoading ? <Skeleton className="h-40" /> : q.data?.map((p) => (
              <button key={p.id} onClick={() => selecionar(p)} className={`w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted ${editing?.id === p.id ? "border-primary bg-muted" : "border-border"}`}>
                <div className="font-medium">{p.titulo}</div>
                <div className="text-xs text-muted-foreground">{p.chave} · {p.modelo}</div>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {!editing ? <p className="text-sm text-muted-foreground">Selecione um prompt para editar.</p> : (
              <>
                <div><Label>Modelo</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="google/gemini-2.5-flash" /></div>
                <div><Label>Template</Label><Textarea value={template} onChange={(e) => setTemplate(e.target.value)} className="min-h-56 font-mono text-xs" /></div>
                <Button onClick={() => save.mutate()} disabled={save.isPending}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias de Lead ({catQ.data?.length ?? 0})</CardTitle>
          <CardDescription>Catálogo do Lead Scraper com buscas inteligentes por cidade.</CardDescription>
        </CardHeader>
        <CardContent>
          {catQ.isLoading ? <Skeleton className="h-40" /> : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {catQ.data?.map((c) => (
                <div key={c.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{c.nome}</span>
                    {c.grupo && <Badge variant="outline" className="text-[10px]">{c.grupo}</Badge>}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{c.buscas.length} buscas</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
