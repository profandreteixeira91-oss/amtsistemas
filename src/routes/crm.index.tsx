import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardIA } from "@/lib/crm/dashboard.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2, KanbanSquare, Wallet, TrendingUp, Calendar, Flame, Bot, Bell, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/")({
  head: () => ({ meta: [{ title: "Dashboard · AMT CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DashboardPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function DashboardPage() {
  const carregar = useServerFn(dashboardIA);
  const q = useQuery({ queryKey: ["crm_dashboard_ia"], queryFn: () => carregar(), refetchInterval: 120_000 });
  const d = q.data as any;

  const kpis = d?.kpis;
  const cards = [
    { label: "Leads hoje", value: kpis?.leadsHoje ?? 0, icon: Sparkles, tone: "text-blue-500" },
    { label: "Leads semana", value: kpis?.leadsSemana ?? 0, icon: Sparkles, tone: "text-indigo-500" },
    { label: "Leads mês", value: kpis?.leadsMes ?? 0, icon: TrendingUp, tone: "text-violet-500" },
    { label: "Clientes ativos", value: kpis?.clientes ?? 0, icon: Building2, tone: "text-emerald-500" },
    { label: "Pipeline aberto", value: brl(kpis?.pipelineAberto ?? 0), icon: KanbanSquare, tone: "text-amber-500" },
    { label: "Pipeline ponderado", value: brl(kpis?.pipelinePonderado ?? 0), icon: TrendingUp, tone: "text-orange-500" },
    { label: "Receita 30d", value: brl(kpis?.receitaMes ?? 0), icon: Wallet, tone: "text-emerald-600" },
    { label: "Conversão", value: `${kpis?.taxaConversao ?? 0}%`, icon: Trophy, tone: "text-yellow-500" },
  ];

  const funil = d?.funil ?? {};
  const funilTotal = Object.values(funil as Record<string, number>).reduce((s: number, v) => s + Number(v), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão comercial da AMT em tempo real com IA.</p>
        </div>
        {(kpis?.alertasNaoLidos ?? 0) > 0 && (
          <Link to="/crm/alertas">
            <Badge variant="destructive" className="gap-1"><Bell className="h-3 w-3" /> {kpis.alertasNaoLidos} alertas</Badge>
          </Link>
        )}
      </div>

      {/* Resumo IA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Bot className="h-4 w-4 text-primary" /> Resumo do dia · IA</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? <Skeleton className="h-12" /> : (
            <p className="text-sm leading-relaxed">{d?.resumoIA ?? "Sem dados suficientes ainda. Capture leads e a IA passa a resumir seu dia."}</p>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((k) => (
          <Card key={k.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <k.icon className={`h-3.5 w-3.5 ${k.tone}`} />{k.label}
              </div>
              <div className="mt-2 text-xl font-semibold">
                {q.isLoading ? <Skeleton className="h-6 w-20" /> : k.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funil */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><KanbanSquare className="h-4 w-4" /> Funil de leads</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.isLoading ? <Skeleton className="h-32" /> : Object.entries(funil).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead ainda.</p>
            ) : Object.entries(funil).map(([status, count]) => {
              const pct = Math.round((Number(count) / funilTotal) * 100);
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize">{status.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{String(count)} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top leads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Flame className="h-4 w-4 text-red-500" /> Top leads · score</CardTitle>
            <CardDescription>Ranking IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.isLoading ? <Skeleton className="h-32" /> :
             (d?.topLeads ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Rode o scoring para começar.</p>
            ) : (d?.topLeads as any[]).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1 truncate">{l.empresa ?? l.nome}</div>
                <Badge variant={l.score >= 75 ? "destructive" : "secondary"}>{l.score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Agenda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4" /> Próximos compromissos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {q.isLoading ? <Skeleton className="h-20" /> :
           (d?.proximos ?? []).length === 0 ? (
            <p className="text-muted-foreground">Nada agendado.</p>
          ) : (d?.proximos as any[]).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span>{c.titulo}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.inicio).toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
