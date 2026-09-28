import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/crm/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PipelinePage,
});

const ESTAGIOS = [
  { value: "prospeccao", label: "Prospecção", color: "border-t-blue-500" },
  { value: "qualificacao", label: "Qualificação", color: "border-t-indigo-500" },
  { value: "proposta", label: "Proposta", color: "border-t-purple-500" },
  { value: "negociacao", label: "Negociação", color: "border-t-amber-500" },
  { value: "ganha", label: "Ganha", color: "border-t-emerald-500" },
  { value: "perdida", label: "Perdida", color: "border-t-rose-500" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PipelinePage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["crm_pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_oportunidades").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; titulo: string; valor: number; probabilidade: number; estagio: string }>;
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, estagio }: { id: string; estagio: string }) => {
      const patch: any = { estagio };
      if (["ganha", "perdida"].includes(estagio)) patch.fechada_em = new Date().toISOString();
      const { error } = await supabase.from("manager_oportunidades").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_pipeline"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const cols = useMemo(() => ESTAGIOS.map((e) => {
    const items = (q.data ?? []).filter((o) => o.estagio === e.value);
    return { ...e, items, total: items.reduce((s, o) => s + Number(o.valor), 0) };
  }), [q.data]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Arraste — ou use o seletor — para mover oportunidades entre estágios.</p>
      </div>
      {q.isLoading ? <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div> : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {cols.map((col) => (
            <Card key={col.value} className={`border-t-4 ${col.color}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{col.label}</span>
                  <Badge variant="secondary">{col.items.length}</Badge>
                </CardTitle>
                <div className="text-xs text-muted-foreground">{brl(col.total)}</div>
              </CardHeader>
              <CardContent className="min-h-40 space-y-2">
                {col.items.map((o) => (
                  <div key={o.id} className="rounded-md border bg-card p-2.5 text-sm">
                    <div className="font-medium leading-tight">{o.titulo}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{brl(Number(o.valor))} · {o.probabilidade}%</div>
                    <Select value={o.estagio} onValueChange={(v) => move.mutate({ id: o.id, estagio: v })}>
                      <SelectTrigger className="mt-2 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{ESTAGIOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
                {col.items.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">—</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
