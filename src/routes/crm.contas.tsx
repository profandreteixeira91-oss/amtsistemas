import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  finListarLancamentos, finCriarLancamento, finBaixarLancamento, finExcluirLancamento,
  finListarContas, finCriarConta, finListarCategorias, finCriarCategoria, finDashboard,
} from "@/lib/crm/financeiro.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Plus, Check, Trash2, Building2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";

export const Route = createFileRoute("/crm/contas")({
  head: () => ({ meta: [{ title: "Contas · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ContasPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ContasPage() {
  const listar = useServerFn(finListarLancamentos);
  const criar = useServerFn(finCriarLancamento);
  const baixar = useServerFn(finBaixarLancamento);
  const excluir = useServerFn(finExcluirLancamento);
  const listarContas = useServerFn(finListarContas);
  const criarConta = useServerFn(finCriarConta);
  const listarCat = useServerFn(finListarCategorias);
  const criarCat = useServerFn(finCriarCategoria);
  const dash = useServerFn(finDashboard);

  const [openLanc, setOpenLanc] = useState(false);
  const [openConta, setOpenConta] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
  const [f, setF] = useState<any>({ tipo: "receita", descricao: "", valor: 0, vencimento: new Date().toISOString().slice(0, 10), categoria_id: "", conta_id: "", fornecedor: "" });
  const [novaConta, setNovaConta] = useState({ nome: "", banco: "", saldo_inicial: 0 });
  const [novaCat, setNovaCat] = useState({ nome: "", tipo: "receita" as "receita" | "despesa", cor: "#3B82F6" });

  const qL = useQuery({ queryKey: ["fin_lanc"], queryFn: () => listar({ data: {} }) });
  const qC = useQuery({ queryKey: ["fin_contas"], queryFn: () => listarContas() });
  const qK = useQuery({ queryKey: ["fin_cat"], queryFn: () => listarCat() });
  const qD = useQuery({ queryKey: ["fin_dash"], queryFn: () => dash(), refetchInterval: 30_000 });

  const mCriar = useMutation({
    mutationFn: () => criar({ data: { ...f, tipo, valor: Number(f.valor), categoria_id: f.categoria_id || null, conta_id: f.conta_id || null } }),
    onSuccess: () => { toast.success("Lançamento criado"); setOpenLanc(false); qL.refetch(); qD.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const mBaixar = useMutation({
    mutationFn: (id: string) => baixar({ data: { id } }),
    onSuccess: () => { toast.success("Baixado"); qL.refetch(); qD.refetch(); qC.refetch(); },
  });
  const mExc = useMutation({
    mutationFn: (id: string) => excluir({ data: { id } }),
    onSuccess: () => { qL.refetch(); qD.refetch(); },
  });
  const mConta = useMutation({
    mutationFn: () => criarConta({ data: { ...novaConta, saldo_inicial: Number(novaConta.saldo_inicial) } }),
    onSuccess: () => { toast.success("Conta criada"); setOpenConta(false); setNovaConta({ nome: "", banco: "", saldo_inicial: 0 }); qC.refetch(); },
  });
  const mCat = useMutation({
    mutationFn: () => criarCat({ data: novaCat }),
    onSuccess: () => { toast.success("Categoria criada"); setOpenCat(false); setNovaCat({ nome: "", tipo: "receita", cor: "#3B82F6" }); qK.refetch(); },
  });

  const d = qD.data;
  const projecao = useMemo(() => (d?.projecao ?? []).map((p) => ({ ...p, label: new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) })), [d]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas & Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Contas a pagar, a receber, projeção de fluxo e DRE.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openConta} onOpenChange={setOpenConta}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Building2 className="mr-2 h-4 w-4" />Nova conta</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nova conta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={novaConta.nome} onChange={(e) => setNovaConta({ ...novaConta, nome: e.target.value })} /></div>
                <div><Label>Banco</Label><Input value={novaConta.banco} onChange={(e) => setNovaConta({ ...novaConta, banco: e.target.value })} /></div>
                <div><Label>Saldo inicial</Label><Input type="number" step="0.01" value={novaConta.saldo_inicial} onChange={(e) => setNovaConta({ ...novaConta, saldo_inicial: Number(e.target.value) })} /></div>
                <Button className="w-full" onClick={() => mConta.mutate()}>Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openCat} onOpenChange={setOpenCat}>
            <DialogTrigger asChild><Button variant="outline" size="sm">Categoria</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={novaCat.nome} onChange={(e) => setNovaCat({ ...novaCat, nome: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={novaCat.tipo} onValueChange={(v: any) => setNovaCat({ ...novaCat, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Cor</Label><Input type="color" value={novaCat.cor} onChange={(e) => setNovaCat({ ...novaCat, cor: e.target.value })} /></div>
                <Button className="w-full" onClick={() => mCat.mutate()}>Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openLanc} onOpenChange={setOpenLanc}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo lançamento</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Tabs value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <TabsList className="w-full"><TabsTrigger value="receita" className="flex-1">Receita</TabsTrigger><TabsTrigger value="despesa" className="flex-1">Despesa</TabsTrigger></TabsList>
                </Tabs>
                <div><Label>Descrição</Label><Input value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Valor</Label><Input type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
                  <div><Label>Vencimento</Label><Input type="date" value={f.vencimento} onChange={(e) => setF({ ...f, vencimento: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Categoria</Label>
                    <Select value={f.categoria_id} onValueChange={(v) => setF({ ...f, categoria_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{(qK.data ?? []).filter((c: any) => c.tipo === tipo).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Conta</Label>
                    <Select value={f.conta_id} onValueChange={(v) => setF({ ...f, conta_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{(qC.data ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>{tipo === "receita" ? "Cliente" : "Fornecedor"}</Label><Input value={f.fornecedor} onChange={(e) => setF({ ...f, fornecedor: e.target.value })} /></div>
                <Button className="w-full" onClick={() => mCriar.mutate()} disabled={mCriar.isPending}>Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="A receber" value={brl(d?.receber ?? 0)} icon={TrendingUp} tone="pos" />
        <Kpi label="A pagar" value={brl(d?.pagar ?? 0)} icon={TrendingDown} tone="neg" />
        <Kpi label="Saldo em contas" value={brl(d?.saldoTotal ?? 0)} icon={Wallet} />
        <Kpi label={`${d?.atrasados ?? 0} atrasados`} value={brl(d?.atrasadosValor ?? 0)} icon={AlertCircle} tone="warn" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Fluxo de caixa projetado — próximos 30 dias</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={projecao}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" fontSize={10} />
              <YAxis fontSize={10} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
              <Tooltip formatter={(v: any) => brl(Number(v))} />
              <Area type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(qL.data?.length ?? 0) === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Nenhum lançamento.</div> :
            <div className="divide-y max-h-[600px] overflow-auto">
              {qL.data!.map((l: any) => {
                const atrasado = l.status === "pendente" && l.vencimento < new Date().toISOString().slice(0, 10);
                return (
                  <div key={l.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <div className={`h-2 w-2 rounded-full ${l.tipo === "receita" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{l.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        Venc {new Date(l.vencimento).toLocaleDateString("pt-BR")}
                        {l.fornecedor && ` · ${l.fornecedor}`}
                      </div>
                    </div>
                    <Badge variant={l.status === "pago" ? "default" : atrasado ? "destructive" : "secondary"} className="text-[10px]">
                      {atrasado ? "atrasado" : l.status}
                    </Badge>
                    <span className={`w-28 text-right tabular-nums font-medium ${l.tipo === "receita" ? "text-emerald-600" : "text-rose-600"}`}>
                      {l.tipo === "receita" ? "+" : "−"}{brl(Number(l.valor))}
                    </span>
                    {l.status !== "pago" && (
                      <Button size="sm" variant="ghost" onClick={() => mBaixar.mutate(l.id)}><Check className="h-3.5 w-3.5" /></Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => mExc.mutate(l.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Contas bancárias</CardTitle></CardHeader>
        <CardContent className="p-0">
          {(qC.data?.length ?? 0) === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma conta cadastrada.</div> :
            <div className="divide-y">
              {qC.data!.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{c.banco || c.tipo}</div>
                  </div>
                  <div className="text-right">
                    <div className="tabular-nums font-semibold">{brl(Number(c.saldo_atual))}</div>
                    <div className="text-[10px] text-muted-foreground">saldo atual</div>
                  </div>
                </div>
              ))}
            </div>}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone?: "pos" | "neg" | "warn" }) {
  const color = tone === "pos" ? "text-emerald-600 bg-emerald-500/10" : tone === "neg" ? "text-rose-600 bg-rose-500/10" : tone === "warn" ? "text-amber-600 bg-amber-500/10" : "text-primary bg-primary/10";
  return (
    <Card><CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
      <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-lg font-semibold">{value}</div></div>
    </CardContent></Card>
  );
}
