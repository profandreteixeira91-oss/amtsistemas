import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/crm/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FinanceiroPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const txQ = useQuery({
    queryKey: ["crm_tx"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_transacoes").select("id, tipo, categoria, descricao, valor, data").order("data", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cobQ = useQuery({
    queryKey: ["crm_cob"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_cobrancas").select("id, descricao, valor, vencimento, status, cliente_id").order("vencimento", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const kpis = useMemo(() => {
    const tx = txQ.data ?? [];
    const cob = cobQ.data ?? [];
    const receita = tx.filter((t: any) => t.tipo === "receita").reduce((a: number, b: any) => a + Number(b.valor || 0), 0);
    const despesa = tx.filter((t: any) => t.tipo === "despesa").reduce((a: number, b: any) => a + Number(b.valor || 0), 0);
    const inad = cob.filter((c: any) => c.status === "atrasada" || (c.status !== "paga" && new Date(c.vencimento) < new Date())).reduce((a: number, b: any) => a + Number(b.valor || 0), 0);
    const mrr = cob.filter((c: any) => c.status === "paga").reduce((a: number, b: any) => a + Number(b.valor || 0), 0);
    return { receita, despesa, saldo: receita - despesa, inad, mrr };
  }, [txQ.data, cobQ.data]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Receitas, despesas e cobranças.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita" value={brl(kpis.receita)} icon={TrendingUp} tone="pos" />
        <Kpi label="Despesa" value={brl(kpis.despesa)} icon={TrendingDown} tone="neg" />
        <Kpi label="Saldo" value={brl(kpis.saldo)} icon={Wallet} />
        <Kpi label="Inadimplência" value={brl(kpis.inad)} icon={AlertCircle} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Últimas transações</CardTitle></CardHeader>
          <CardContent className="p-0">
            {txQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
              (txQ.data?.length ?? 0) === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Sem transações.</div> :
              <div className="divide-y max-h-96 overflow-auto">
                {txQ.data!.slice(0, 30).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{t.descricao || t.categoria}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.data).toLocaleDateString("pt-BR")} · {t.categoria}</div>
                    </div>
                    <span className={`tabular-nums font-medium ${t.tipo === "receita" ? "text-emerald-600" : "text-rose-600"}`}>{t.tipo === "receita" ? "+" : "−"}{brl(Number(t.valor))}</span>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cobranças</CardTitle></CardHeader>
          <CardContent className="p-0">
            {cobQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
              (cobQ.data?.length ?? 0) === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Sem cobranças.</div> :
              <div className="divide-y max-h-96 overflow-auto">
                {cobQ.data!.slice(0, 30).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{c.descricao || "Cobrança"}</div>
                      <div className="text-xs text-muted-foreground">Vence {new Date(c.vencimento).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "paga" ? "default" : c.status === "atrasada" ? "destructive" : "secondary"} className="text-[10px]">{c.status}</Badge>
                      <span className="w-24 text-right tabular-nums">{brl(Number(c.valor))}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone?: "pos" | "neg" | "warn" }) {
  const color = tone === "pos" ? "text-emerald-600 bg-emerald-500/10" : tone === "neg" ? "text-rose-600 bg-rose-500/10" : tone === "warn" ? "text-amber-600 bg-amber-500/10" : "text-primary bg-primary/10";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
