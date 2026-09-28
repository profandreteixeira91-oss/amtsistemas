import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Zap, RefreshCw, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/crm/automacoes")({
  head: () => ({ meta: [{ title: "Automações · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AutomacoesPage,
});

type Enrollment = { id: string; sequencia_id: string; lead_id: string | null; passo_atual: number; proximo_disparo_em: string; status: string; ultima_execucao_em: string | null; mensagens_geradas: number };
type Sequencia = { id: string; nome: string };
type Lead = { id: string; nome: string | null; empresa: string | null };

const TICK_URL = "/api/public/hooks/crm-sequencias-tick";

function AutomacoesPage() {
  const qc = useQueryClient();
  const [ticking, setTicking] = useState(false);
  const [ultResult, setUltResult] = useState<any>(null);

  const enrQ = useQuery({
    queryKey: ["crm_enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_sequencia_enrollments" as any).select("*").order("proximo_disparo_em", { ascending: true }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Enrollment[];
    },
  });

  const seqQ = useQuery({
    queryKey: ["crm_seq_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_sequencias").select("id, nome");
      if (error) throw error;
      return data as Sequencia[];
    },
  });

  const leadIds = [...new Set((enrQ.data ?? []).map((e) => e.lead_id).filter(Boolean) as string[])];
  const leadsQ = useQuery({
    queryKey: ["crm_enroll_leads", leadIds.sort().join(",")],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_leads").select("id, nome, empresa").in("id", leadIds);
      if (error) throw error;
      return data as Lead[];
    },
  });

  const disparar = useMutation({
    mutationFn: async () => {
      setTicking(true);
      const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(TICK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key ?? "" },
        body: "{}",
      });
      if (!resp.ok) throw new Error(`Erro ${resp.status}: ${await resp.text()}`);
      return await resp.json();
    },
    onSuccess: (r) => { setUltResult(r); toast.success(`Tick executado: ${r.processed ?? 0} processadas`); qc.invalidateQueries({ queryKey: ["crm_enrollments"] }); },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setTicking(false),
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_sequencia_enrollments" as any).update({ status: "cancelada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cancelada"); qc.invalidateQueries({ queryKey: ["crm_enrollments"] }); },
  });

  const seqNome = (id: string) => seqQ.data?.find((s) => s.id === id)?.nome ?? "—";
  const leadNome = (id: string | null) => {
    if (!id) return "—";
    const l = leadsQ.data?.find((x) => x.id === id);
    return l ? (l.empresa || l.nome || "Lead") : "…";
  };

  const cronSQL = `select cron.schedule(
  'crm-sequencias-tick-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url:='https://project--9004f8a7-a4e5-4c85-a320-7cc61b2f87a4.lovable.app${TICK_URL}',
    headers:='{"Content-Type":"application/json","apikey":"<SUA_PUBLISHABLE_KEY>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);`;

  const statusCounts = (enrQ.data ?? []).reduce<Record<string, number>>((acc, e) => { acc[e.status] = (acc[e.status] ?? 0) + 1; return acc; }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automações</h1>
          <p className="text-sm text-muted-foreground">Engine de sequências. Cada tick avança leads inscritos e gera mensagens pendentes.</p>
        </div>
        <Button onClick={() => disparar.mutate()} disabled={ticking}>
          <PlayCircle className="mr-2 h-4 w-4" />{ticking ? "Executando…" : "Rodar tick agora"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={Zap} label="Ativas" value={statusCounts["ativa"] ?? 0} tone="pos" />
        <StatCard icon={Clock} label="Pausadas" value={statusCounts["pausada"] ?? 0} />
        <StatCard icon={CheckCircle2} label="Concluídas" value={statusCounts["concluida"] ?? 0} />
        <StatCard icon={XCircle} label="Canceladas" value={statusCounts["cancelada"] ?? 0} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Inscrições em sequências</CardTitle>
          <CardDescription>Quem está em qual passo e quando será o próximo disparo.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {enrQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (enrQ.data?.length ?? 0) === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum lead inscrito. Vá em <strong>Leads</strong> e inscreva alguém em uma sequência.</div> :
            <div className="divide-y">
              {enrQ.data!.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{leadNome(e.lead_id)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate text-muted-foreground">{seqNome(e.sequencia_id)}</span>
                      <Badge variant={e.status === "ativa" ? "default" : "secondary"} className="text-[10px]">{e.status}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Passo #{e.passo_atual + 1} · {e.mensagens_geradas} msgs · próximo {new Date(e.proximo_disparo_em).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  {e.status === "ativa" && <Button size="sm" variant="ghost" onClick={() => cancelar.mutate(e.id)}>Cancelar</Button>}
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" />Agendar via pg_cron</CardTitle>
          <CardDescription>Copie e rode este SQL no Supabase para executar o tick a cada 15 minutos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="overflow-auto rounded-lg bg-muted/40 p-3 text-xs">{cronSQL}</pre>
            <Button size="sm" variant="outline" className="absolute right-2 top-2" onClick={() => { navigator.clipboard.writeText(cronSQL); toast.success("SQL copiado"); }}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Requer as extensões <code>pg_cron</code> e <code>pg_net</code> habilitadas.</p>
        </CardContent>
      </Card>

      {ultResult && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Último tick</CardTitle></CardHeader>
          <CardContent><pre className="max-h-64 overflow-auto rounded bg-muted/40 p-3 text-xs">{JSON.stringify(ultResult, null, 2)}</pre></CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone?: "pos" }) {
  const color = tone === "pos" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary";
  return (
    <Card><CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
      <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-lg font-semibold tabular-nums">{value}</div></div>
    </CardContent></Card>
  );
}
