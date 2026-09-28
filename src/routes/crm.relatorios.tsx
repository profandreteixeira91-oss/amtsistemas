import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart3, Plus, Play, Save, Trash2, Download, Star, Filter, Group } from "lucide-react";
import {
  listarFontes, executarRelatorio, salvarRelatorio, removerRelatorio, type FonteDef,
} from "@/lib/crm/relatorios.functions";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";

const OPERADORES = ["=", "!=", ">", ">=", "<", "<=", "contem", "in", "vazio", "preenchido"];
const CORES = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

function Editor({ rel, fontes, onClose }: { rel: any; fontes: FonteDef[]; onClose: () => void }) {
  const qc = useQueryClient();
  const executar = useServerFn(executarRelatorio);
  const salvar = useServerFn(salvarRelatorio);

  const [nome, setNome] = useState(rel?.nome ?? "Novo relatório");
  const [fonteKey, setFonteKey] = useState<string>(rel?.fonte ?? fontes[0]?.key);
  const [colunas, setColunas] = useState<string[]>(rel?.colunas ?? []);
  const [filtros, setFiltros] = useState<any[]>(rel?.filtros ?? []);
  const [ordenacao, setOrdenacao] = useState<any[]>(rel?.ordenacao ?? []);
  const [limite, setLimite] = useState<number>(rel?.limite ?? 500);
  const [grpCampo, setGrpCampo] = useState<string>(rel?.agrupamento?.campo ?? "");
  const [grpAggCampo, setGrpAggCampo] = useState<string>(rel?.agrupamento?.agregar_campo ?? "");
  const [grpAggTipo, setGrpAggTipo] = useState<string>(rel?.agrupamento?.agregar_tipo ?? "count");
  const [chartTipo, setChartTipo] = useState<string>(rel?.chart_tipo ?? "tabela");

  const fonte = useMemo(() => fontes.find((f) => f.key === fonteKey), [fonteKey, fontes]);

  const runMut = useMutation({
    mutationFn: () => executar({ data: {
      fonte: fonteKey, colunas, filtros, ordenacao, limite,
      agrupamento: grpCampo ? { campo: grpCampo, agregar_campo: grpAggCampo || null, agregar_tipo: grpAggTipo as any } : undefined,
    } }),
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const salvarMut = useMutation({
    mutationFn: () => salvar({ data: {
      id: rel?.id, nome, fonte: fonteKey, colunas, filtros, ordenacao, limite,
      agrupamento: grpCampo ? { campo: grpCampo, agregar_campo: grpAggCampo || null, agregar_tipo: grpAggTipo } : {},
      chart_tipo: chartTipo, chart_config: {},
    } }),
    onSuccess: () => { toast.success("Relatório salvo"); qc.invalidateQueries({ queryKey: ["rels"] }); onClose(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const linhas = runMut.data?.linhas ?? [];
  const agrupado = runMut.data?.agrupado ?? null;

  const exportCsv = () => {
    const csv = Papa.unparse(agrupado ?? linhas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${nome}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-[320px_1fr] gap-4 h-[80vh] overflow-hidden">
      <div className="border rounded p-3 space-y-3 overflow-auto text-sm">
        <div>
          <div className="text-xs font-medium">Nome</div>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-medium">Fonte de dados</div>
          <Select value={fonteKey} onValueChange={(v) => { setFonteKey(v); setColunas([]); setFiltros([]); setOrdenacao([]); setGrpCampo(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{fontes.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div>
          <div className="text-xs font-medium mb-1">Colunas</div>
          <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
            {fonte?.colunas.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={colunas.includes(c.key)}
                  onChange={(e) => setColunas(e.target.checked ? [...colunas, c.key] : colunas.filter((x) => x !== c.key))} />
                {c.label} <span className="text-muted-foreground">({c.tipo})</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium mb-1 flex items-center gap-1"><Filter className="h-3 w-3"/> Filtros</div>
          {filtros.map((f, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <Select value={f.campo} onValueChange={(v) => { const n = [...filtros]; n[i].campo = v; setFiltros(n); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{fonte?.colunas.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={f.operador} onValueChange={(v) => { const n = [...filtros]; n[i].operador = v; setFiltros(n); }}>
                <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{OPERADORES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-8 text-xs" value={f.valor ?? ""} onChange={(e) => { const n = [...filtros]; n[i].valor = e.target.value; setFiltros(n); }} />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFiltros(filtros.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full" onClick={() => setFiltros([...filtros, { campo: fonte?.colunas[0]?.key, operador: "=", valor: "" }])}>
            <Plus className="h-3 w-3 mr-1" /> Filtro
          </Button>
        </div>

        <div>
          <div className="text-xs font-medium mb-1 flex items-center gap-1"><Group className="h-3 w-3"/> Agrupar</div>
          <Select value={grpCampo || "none"} onValueChange={(v) => setGrpCampo(v === "none" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sem agrupamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem agrupamento</SelectItem>
              {fonte?.colunas.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {grpCampo && (
            <div className="flex gap-1 mt-1">
              <Select value={grpAggTipo} onValueChange={setGrpAggTipo}>
                <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{["count","sum","avg"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {grpAggTipo !== "count" && (
                <Select value={grpAggCampo} onValueChange={setGrpAggCampo}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Campo numérico" /></SelectTrigger>
                  <SelectContent>{fonte?.colunas.filter((c) => c.tipo === "number").map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-medium mb-1">Visualização</div>
          <Select value={chartTipo} onValueChange={setChartTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["tabela","kpi","barra","linha","pizza"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div>
          <div className="text-xs font-medium mb-1">Limite</div>
          <Input type="number" value={limite} onChange={(e) => setLimite(Number(e.target.value))} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={() => runMut.mutate()} disabled={runMut.isPending} className="flex-1">
            <Play className="h-3 w-3 mr-1" /> Executar
          </Button>
          <Button size="sm" variant="outline" onClick={() => salvarMut.mutate()} disabled={salvarMut.isPending}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="border rounded overflow-auto p-3">
        {runMut.isPending && <div>Executando...</div>}
        {!runMut.data && !runMut.isPending && <div className="text-muted-foreground text-sm">Clique "Executar" para ver o resultado.</div>}

        {runMut.data && (
          <>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">{runMut.data.total} linhas</div>
              <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-3 w-3 mr-1"/> CSV</Button>
            </div>

            {chartTipo === "kpi" && agrupado && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {agrupado.slice(0, 8).map((g: any, i: number) => (
                  <Card key={i}><CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">{g.grupo}</div>
                    <div className="text-2xl font-bold">{g.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</div>
                  </CardContent></Card>
                ))}
              </div>
            )}
            {chartTipo === "barra" && agrupado && (
              <div className="h-80"><ResponsiveContainer><BarChart data={agrupado}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="grupo"/><YAxis/><Tooltip/><Legend/>
                <Bar dataKey="valor" fill="#3b82f6"/></BarChart></ResponsiveContainer></div>
            )}
            {chartTipo === "linha" && agrupado && (
              <div className="h-80"><ResponsiveContainer><LineChart data={agrupado}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="grupo"/><YAxis/><Tooltip/><Legend/>
                <Line type="monotone" dataKey="valor" stroke="#3b82f6"/></LineChart></ResponsiveContainer></div>
            )}
            {chartTipo === "pizza" && agrupado && (
              <div className="h-80"><ResponsiveContainer><PieChart>
                <Pie data={agrupado} dataKey="valor" nameKey="grupo" outerRadius={100} label>
                  {agrupado.map((_: any, i: number) => <Cell key={i} fill={CORES[i % CORES.length]}/>)}
                </Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
            )}
            {(chartTipo === "tabela" || !agrupado) && (
              <div className="overflow-auto border rounded">
                <table className="text-xs w-full">
                  <thead className="bg-muted">
                    <tr>{Object.keys((agrupado?.[0] ?? linhas[0]) ?? {}).map((k) => (
                      <th key={k} className="text-left px-2 py-1">{k}</th>
                    ))}</tr>
                  </thead>
                  <tbody>{(agrupado ?? linhas).slice(0, 200).map((r: any, i: number) => (
                    <tr key={i} className="border-t">{Object.values(r).map((v: any, j) => (
                      <td key={j} className="px-2 py-1">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}</td>
                    ))}</tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Page() {
  const qc = useQueryClient();
  const listar = useServerFn(listarFontes);
  const remover = useServerFn(removerRelatorio);
  const [editando, setEditando] = useState<any | null>(null);

  const { data: fontes } = useQuery({ queryKey: ["rel-fontes"], queryFn: () => listar({}) });
  const { data: rels } = useQuery({
    queryKey: ["rels"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("crm_relatorios").select("*").order("updated_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const removerMut = useMutation({
    mutationFn: (id: string) => remover({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["rels"] }); },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6"/> Relatórios & BI</h1>
          <p className="text-sm text-muted-foreground">Monte queries visuais sobre leads, propostas, financeiro e mais.</p>
        </div>
        <Button onClick={() => setEditando({})}><Plus className="h-4 w-4 mr-1"/> Novo relatório</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(rels ?? []).map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {r.favorito && <Star className="h-3 w-3 text-amber-500 fill-amber-500"/>}
                  {r.nome}
                </CardTitle>
                <Badge variant="outline">{r.chart_tipo}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{r.fonte} · {(r.colunas ?? []).length} colunas · {(r.filtros ?? []).length} filtros</div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditando(r)}>Abrir</Button>
                <Button size="sm" variant="ghost" onClick={() => removerMut.mutate(r.id)}><Trash2 className="h-3 w-3"/></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw]">
          <DialogHeader><DialogTitle>Editor de relatório</DialogTitle></DialogHeader>
          {editando && fontes && (
            <Editor rel={editando?.id ? editando : null} fontes={fontes} onClose={() => setEditando(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute("/crm/relatorios")({
  component: Page,
});
