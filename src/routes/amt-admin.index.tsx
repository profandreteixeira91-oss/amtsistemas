import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { amtDashboard } from "@/lib/amt-admin/admin.functions";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#94a3b8"];

function DashboardPage() {
  const dash = useServerFn(amtDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["amt-dashboard"], queryFn: () => dash() });

  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  const k = data.kpis;

  const cards = [
    { label: "MRR", value: fmt(k.mrr) },
    { label: "ARR", value: fmt(k.arr) },
    { label: "Ticket médio", value: fmt(k.ticket) },
    { label: "Receita 30d", value: fmt(k.receita30d) },
    { label: "Assinaturas ativas", value: k.ativos },
    { label: "Em trial", value: k.trial },
    { label: "Inadimplentes", value: k.inadimplentes },
    { label: "Conversão trial→ativa", value: `${k.conversao}%` },
    { label: "Churn", value: `${k.churn}%` },
    { label: "Cobranças pendentes", value: k.cobrancasPendentes },
    { label: "Clientes", value: k.clientesTotal },
    { label: "Sistemas", value: k.sistemas },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">KPIs consolidados dos sistemas AMT.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-lg font-bold mt-1">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Receita & leads · últimos 30 dias</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.serie}>
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis yAxisId="l" fontSize={11} />
                <YAxis yAxisId="r" orientation="right" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="l" dataKey="receita" fill="#3b82f6" name="Receita (R$)" />
                <Bar yAxisId="r" dataKey="leads" fill="#22c55e" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição de assinaturas</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {data.statusChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Últimos clientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.ultimosClientes.length === 0 && <div className="text-sm text-muted-foreground">Nenhum ainda.</div>}
            {data.ultimosClientes.map((c: any) => (
              <div key={c.id} className="flex justify-between text-sm border-b pb-1 last:border-0">
                <span className="font-medium truncate">{c.nome ?? c.empresa}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Últimos pagamentos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.ultimosPagamentos.length === 0 && <div className="text-sm text-muted-foreground">Nenhum ainda.</div>}
            {data.ultimosPagamentos.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm border-b pb-1 last:border-0">
                <span className="truncate">{p.descricao ?? "Cobrança"}</span>
                <Badge variant="outline">{fmt(Number(p.valor))}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cancelamentos recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.ultimosCancelamentos.length === 0 && <div className="text-sm text-muted-foreground">Nenhum.</div>}
            {data.ultimosCancelamentos.map((c: any) => (
              <div key={c.id} className="flex justify-between text-sm border-b pb-1 last:border-0">
                <span>{c.plano}</span>
                <Badge variant="destructive">{fmt(Number(c.valor))}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/amt-admin/")({
  component: DashboardPage,
});
