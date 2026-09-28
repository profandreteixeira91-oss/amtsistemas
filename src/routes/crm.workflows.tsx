import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, type Node, type Edge, type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Play, Save, Workflow as WfIcon, Zap, GitBranch, MessageSquare, Bell, ListTodo, Sparkles, Webhook, Clock, PencilLine } from "lucide-react";
import {
  salvarWorkflow, removerWorkflow, executarWorkflow, listarExecucoes,
} from "@/lib/crm/workflows.functions";

const GATILHOS = [
  { value: "manual", label: "Manual (botão)" },
  { value: "lead_novo", label: "Novo lead (via app)" },
  { value: "score_atingido", label: "Score atingido (tick)" },
  { value: "sem_contato_dias", label: "Lead sem contato há X dias (tick)" },
  { value: "agendado", label: "Agendado (tick horário)" },
];

const ACOES = [
  { value: "enfileirar_mensagem", label: "Enviar mensagem", icon: MessageSquare },
  { value: "criar_tarefa", label: "Criar tarefa", icon: ListTodo },
  { value: "criar_alerta", label: "Criar alerta", icon: Bell },
  { value: "atualizar_lead", label: "Atualizar lead", icon: PencilLine },
  { value: "chamar_ia", label: "Chamar IA", icon: Sparkles },
  { value: "webhook", label: "Chamar webhook", icon: Webhook },
  { value: "aguardar", label: "Aguardar", icon: Clock },
];

function novoId() { return `n_${Math.random().toString(36).slice(2, 9)}`; }

function EditorInner({ workflow, onClose }: { workflow: any; onClose: () => void }) {
  const qc = useQueryClient();
  const salvar = useServerFn(salvarWorkflow);
  const executar = useServerFn(executarWorkflow);
  const listarExecs = useServerFn(listarExecucoes);

  const [nome, setNome] = useState(workflow?.nome ?? "Novo workflow");
  const [descricao, setDescricao] = useState(workflow?.descricao ?? "");
  const [ativo, setAtivo] = useState(workflow?.ativo ?? true);
  const [gatilhoTipo, setGatilhoTipo] = useState(workflow?.gatilho_tipo ?? "manual");
  const [gatilhoConfig, setGatilhoConfig] = useState<any>(workflow?.gatilho_config ?? {});

  const initial = workflow?.definicao ?? {
    nodes: [{ id: "start", type: "gatilho", position: { x: 40, y: 40 }, data: { label: "Início" } }],
    edges: [],
  };
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initial.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges as Edge[]);
  const [selected, setSelected] = useState<Node | null>(null);

  const onConnect = useCallback((c: Connection) => setEdges((es) => addEdge(c, es)), [setEdges]);

  const addNode = (tipo: "condicao" | "acao", acao?: string) => {
    const id = novoId();
    const y = 40 + nodes.length * 90;
    setNodes((ns) => [...ns, {
      id, type: tipo,
      position: { x: 300, y },
      data: tipo === "acao"
        ? { label: ACOES.find((a) => a.value === acao)?.label ?? "Ação", acao, ...defaultsAcao(acao!) }
        : { label: "Condição", campo: "lead.score", operador: ">=", valor: 70 },
    } as Node]);
  };

  const nodeTypes = useMemo(() => ({
    gatilho: NodeBox("Gatilho", "bg-emerald-100 border-emerald-500"),
    condicao: NodeBox("Condição", "bg-amber-100 border-amber-500"),
    acao: NodeBox("Ação", "bg-blue-100 border-blue-500"),
  }), []);

  const doSalvar = useMutation({
    mutationFn: () => salvar({ data: {
      id: workflow?.id, nome, descricao, ativo,
      gatilho_tipo: gatilhoTipo, gatilho_config: gatilhoConfig,
      definicao: { nodes, edges },
    } }),
    onSuccess: () => { toast.success("Workflow salvo"); qc.invalidateQueries({ queryKey: ["crm-workflows"] }); onClose(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const doExecutar = useMutation({
    mutationFn: () => executar({ data: { id: workflow!.id } }),
    onSuccess: (r: any) => toast[r.status === "ok" ? "success" : "error"](`${r.status} — ${r.log_passos.length} passos`),
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const { data: execs } = useQuery({
    queryKey: ["wf-execs", workflow?.id],
    queryFn: () => listarExecs({ data: { workflow_id: workflow!.id } }),
    enabled: !!workflow?.id,
  });

  const updateSelectedData = (patch: any) => {
    if (!selected) return;
    setNodes((ns) => ns.map((n) => n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n));
    setSelected({ ...selected, data: { ...selected.data, ...patch } });
  };

  return (
    <div className="grid grid-cols-[240px_1fr_320px] gap-3 h-[80vh]">
      {/* Paleta */}
      <div className="border rounded p-2 space-y-3 overflow-auto">
        <div>
          <div className="text-xs font-medium mb-1">Nome</div>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-medium mb-1">Descrição</div>
          <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={ativo} onCheckedChange={setAtivo} />
          <span className="text-xs">Ativo</span>
        </div>
        <div>
          <div className="text-xs font-medium mb-1">Gatilho</div>
          <Select value={gatilhoTipo} onValueChange={setGatilhoTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{GATILHOS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {gatilhoTipo === "sem_contato_dias" && (
          <Input type="number" placeholder="Dias" value={gatilhoConfig?.dias ?? 7}
            onChange={(e) => setGatilhoConfig({ dias: Number(e.target.value) })} />
        )}
        {gatilhoTipo === "score_atingido" && (
          <Input type="number" placeholder="Score mínimo" value={gatilhoConfig?.score_min ?? 70}
            onChange={(e) => setGatilhoConfig({ score_min: Number(e.target.value) })} />
        )}

        <div className="border-t pt-2">
          <div className="text-xs font-medium mb-1">Adicionar nó</div>
          <Button size="sm" variant="outline" className="w-full mb-1" onClick={() => addNode("condicao")}>
            <GitBranch className="h-3 w-3 mr-1" /> Condição
          </Button>
          {ACOES.map((a) => (
            <Button key={a.value} size="sm" variant="outline" className="w-full mb-1" onClick={() => addNode("acao", a.value)}>
              <a.icon className="h-3 w-3 mr-1" /> {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="border rounded overflow-hidden">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes as any}
          onNodeClick={(_e, n) => setSelected(n as Node)}
          fitView
        >
          <Background /><Controls /><MiniMap />
        </ReactFlow>
      </div>

      {/* Inspetor */}
      <div className="border rounded p-2 space-y-2 overflow-auto text-sm">
        {!selected ? (
          <div className="text-muted-foreground text-xs">Clique num nó para editar.</div>
        ) : (
          <>
            <div className="font-medium">{selected.type} · {selected.id}</div>
            {selected.type === "condicao" && (() => {
              const d: any = selected.data;
              return (
              <>
                <Input placeholder="campo (ex: lead.score)" value={d.campo ?? ""}
                  onChange={(e) => updateSelectedData({ campo: e.target.value })} />
                <Select value={d.operador ?? "="} onValueChange={(v) => updateSelectedData({ operador: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["=","!=",">",">=","<","<=","contem","vazio","preenchido"].map((o) =>
                      <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="valor" value={d.valor ?? ""}
                  onChange={(e) => updateSelectedData({ valor: e.target.value })} />
                <div className="text-xs text-muted-foreground">
                  Ligue a saída "true" para o caminho positivo e "false" para o negativo (use sourceHandle).
                </div>
              </>
              );
            })()}
            {selected.type === "acao" && (
              <InspetorAcao data={selected.data} onChange={updateSelectedData} />
            )}
            <Button size="sm" variant="destructive" className="w-full"
              onClick={() => {
                setNodes((ns) => ns.filter((n) => n.id !== selected.id));
                setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id));
                setSelected(null);
              }}
            ><Trash2 className="h-3 w-3 mr-1" /> Remover nó</Button>
          </>
        )}

        {workflow?.id && (
          <div className="border-t pt-2 space-y-1">
            <div className="font-medium text-xs">Últimas execuções</div>
            {(execs ?? []).slice(0, 6).map((x: any) => (
              <div key={x.id} className="text-xs flex justify-between">
                <span>{new Date(x.iniciado_em).toLocaleString()}</span>
                <Badge variant={x.status === "ok" ? "default" : "destructive"}>{x.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-3 flex justify-end gap-2">
        {workflow?.id && (
          <Button variant="outline" onClick={() => doExecutar.mutate()} disabled={doExecutar.isPending}>
            <Play className="h-4 w-4 mr-1" /> Executar agora
          </Button>
        )}
        <Button onClick={() => doSalvar.mutate()} disabled={doSalvar.isPending}>
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}

function defaultsAcao(acao: string): any {
  if (acao === "enfileirar_mensagem") return { canal: "whatsapp", destino: "{{lead.telefone}}", conteudo: "Olá {{lead.nome}}!" };
  if (acao === "criar_tarefa") return { titulo: "Retornar contato", tipo: "tarefa" };
  if (acao === "criar_alerta") return { titulo: "Novo alerta", severidade: "info" };
  if (acao === "atualizar_lead") return { campos: { estagio: "qualificado" } };
  if (acao === "chamar_ia") return { sistema: "Consultor SDR.", prompt: "Resuma {{lead.nome}}" };
  if (acao === "webhook") return { metodo: "POST", url: "", body: "{}" };
  if (acao === "aguardar") return { minutos: 60 };
  return {};
}

function InspetorAcao({ data, onChange }: { data: any; onChange: (p: any) => void }) {
  const _d: any = data;
  const acao = data.acao;
  if (acao === "enfileirar_mensagem") return (
    <>
      <Select value={data.canal} onValueChange={(v) => onChange({ canal: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{["whatsapp","email","instagram"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Input placeholder="destino" value={data.destino ?? ""} onChange={(e) => onChange({ destino: e.target.value })} />
      <Textarea rows={4} placeholder="conteúdo (use {{lead.nome}})" value={data.conteudo ?? ""} onChange={(e) => onChange({ conteudo: e.target.value })} />
    </>
  );
  if (acao === "criar_tarefa") return (
    <>
      <Input placeholder="título" value={data.titulo ?? ""} onChange={(e) => onChange({ titulo: e.target.value })} />
      <Textarea rows={2} placeholder="descrição" value={data.descricao ?? ""} onChange={(e) => onChange({ descricao: e.target.value })} />
    </>
  );
  if (acao === "criar_alerta") return (
    <>
      <Input placeholder="título" value={data.titulo ?? ""} onChange={(e) => onChange({ titulo: e.target.value })} />
      <Textarea rows={2} placeholder="mensagem" value={data.mensagem ?? ""} onChange={(e) => onChange({ mensagem: e.target.value })} />
      <Select value={data.severidade ?? "info"} onValueChange={(v) => onChange({ severidade: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{["info","alerta","urgente"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    </>
  );
  if (acao === "atualizar_lead") return (
    <Textarea rows={4} placeholder='JSON de campos, ex: {"estagio":"qualificado","score":80}'
      value={JSON.stringify(data.campos ?? {}, null, 2)}
      onChange={(e) => { try { onChange({ campos: JSON.parse(e.target.value) }); } catch {} }} />
  );
  if (acao === "chamar_ia") return (
    <>
      <Textarea rows={2} placeholder="sistema" value={data.sistema ?? ""} onChange={(e) => onChange({ sistema: e.target.value })} />
      <Textarea rows={4} placeholder="prompt (com {{vars}})" value={data.prompt ?? ""} onChange={(e) => onChange({ prompt: e.target.value })} />
    </>
  );
  if (acao === "webhook") return (
    <>
      <Input placeholder="URL" value={data.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} />
      <Select value={data.metodo ?? "POST"} onValueChange={(v) => onChange({ metodo: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{["POST","PUT","GET"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea rows={3} placeholder="body" value={data.body ?? ""} onChange={(e) => onChange({ body: e.target.value })} />
    </>
  );
  if (acao === "aguardar") return (
    <Input type="number" placeholder="minutos" value={data.minutos ?? 60} onChange={(e) => onChange({ minutos: Number(e.target.value) })} />
  );
  return null;
}

function NodeBox(label: string, cls: string) {
  return ({ data }: any) => (
    <div className={`rounded border-2 px-3 py-2 shadow-sm ${cls} min-w-[140px]`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-medium text-sm">{data?.label ?? ""}</div>
      {data?.acao && <div className="text-xs opacity-70">{data.acao}</div>}
    </div>
  );
}

function Page() {
  const qc = useQueryClient();
  const remover = useServerFn(removerWorkflow);
  const [aberto, setAberto] = useState<any | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["crm-workflows"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("crm_workflows").select("*").order("updated_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const removerMut = useMutation({
    mutationFn: (id: string) => remover({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["crm-workflows"] }); },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <WfIcon className="h-6 w-6" /> Automações Visuais
          </h1>
          <p className="text-sm text-muted-foreground">
            Monte gatilhos → condições → ações. Roda manualmente ou pelo tick horário.
          </p>
        </div>
        <Button onClick={() => setAberto({})}>
          <Plus className="h-4 w-4 mr-1" /> Novo workflow
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(rows ?? []).map((wf) => (
          <Card key={wf.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${wf.ativo ? "text-emerald-600" : "text-muted-foreground"}`} />
                  {wf.nome}
                </CardTitle>
                <Badge variant={wf.ativo ? "default" : "outline"}>{wf.ativo ? "ativo" : "inativo"}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{wf.descricao}</div>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div><b>Gatilho:</b> {wf.gatilho_tipo}</div>
              <div><b>Execuções:</b> {wf.execucoes_total} ({wf.execucoes_ok} ok / {wf.execucoes_erro} erro)</div>
              <div><b>Última:</b> {wf.ultima_execucao ? new Date(wf.ultima_execucao).toLocaleString() : "—"}</div>
              <div className="flex gap-1 pt-2">
                <Button size="sm" variant="outline" onClick={() => setAberto(wf)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => removerMut.mutate(wf.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw]">
          <DialogHeader><DialogTitle>Editor de workflow</DialogTitle></DialogHeader>
          {aberto && (
            <ReactFlowProvider>
              <EditorInner workflow={aberto?.id ? aberto : null} onClose={() => setAberto(null)} />
            </ReactFlowProvider>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute("/crm/workflows")({
  component: Page,
});
