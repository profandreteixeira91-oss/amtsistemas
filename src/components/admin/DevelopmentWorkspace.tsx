import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Code2,
  ExternalLink,
  GitBranch,
  History,
  Plus,
  RefreshCw,
  Server,
  Wrench,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";

type Project = {
  id: string;
  system_id: string;
  name: string;
  description: string | null;
  repository: string | null;
  branch: string | null;
  production_url: string | null;
  stack: string | null;
  status: string;
};

type Issue = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  module: string | null;
  priority: string;
  status: string;
  created_at: string;
};

type Change = {
  id: string;
  project_id: string;
  summary: string;
  change_type: string;
  files: string[];
  commit_sha: string | null;
  commit_url: string | null;
  reason: string | null;
  status: string;
  created_at: string;
};

type Deployment = {
  id: string;
  project_id: string;
  commit_sha: string | null;
  provider: string;
  environment: string;
  status: string;
  url: string | null;
  created_at: string;
  deployed_at: string | null;
};

type HealthCheck = {
  id: string;
  project_id: string;
  status: string;
  response_ms: number | null;
  status_code: number | null;
  url: string | null;
  checked_at: string;
};

const tabs = [
  { id: "projetos", label: "Projetos", icon: Code2 },
  { id: "problemas", label: "Problemas", icon: AlertCircle },
  { id: "alteracoes", label: "Histórico", icon: History },
  { id: "deploys", label: "Deploys", icon: Server },
  { id: "saude", label: "Health Check", icon: Activity },
  { id: "contexto", label: "Contexto", icon: Wrench },
] as const;

export function DevelopmentWorkspace() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("projetos");
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [syncingGitHub, setSyncingGitHub] = useState(false);
  const [contextProjectId, setContextProjectId] = useState("");
  const [contextText, setContextText] = useState("");
  const [issueForm, setIssueForm] = useState({ title: "", project_id: "", module: "", priority: "media", description: "" });

  async function loadAll() {
    setLoading(true);
    setMessage("");
    const [p, i, c, d, h] = await Promise.all([
      amtSupabase.from("development_projects").select("*").order("name"),
      amtSupabase.from("development_issues").select("id,project_id,title,description,module,priority,status,created_at").order("created_at", { ascending: false }),
      amtSupabase.from("development_changes").select("id,project_id,summary,change_type,files,commit_sha,commit_url,reason,status,created_at,issue_id").order("created_at", { ascending: false }).limit(100),
      amtSupabase.from("development_deployments").select("id,project_id,commit_sha,provider,environment,status,url,created_at,deployed_at").order("created_at", { ascending: false }).limit(100),
      amtSupabase.from("system_health_checks").select("id,project_id,status,response_ms,status_code,url,checked_at").order("checked_at", { ascending: false }).limit(100),
    ]);
    const error = p.error || i.error || c.error || d.error || h.error;
    if (error) setMessage("Não foi possível carregar a Central de Desenvolvimento.");
    setProjects((p.data ?? []) as Project[]);
    setIssues((i.data ?? []) as Issue[]);
    setChanges((c.data ?? []) as Change[]);
    setDeployments((d.data ?? []) as Deployment[]);
    setHealth((h.data ?? []) as HealthCheck[]);
    if (!selectedProject && p.data?.[0]?.id) setSelectedProject(p.data[0].id);
    setLoading(false);
  }

  useEffect(() => { void loadAll(); }, []);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const openIssues = issues.filter((i) => !["validado", "corrigido"].includes(i.status)).length;
  const failedDeploys = deployments.filter((d) => d.status === "falha").length;
  const latestHealth = projects.map((p) => health.find((h) => h.project_id === p.id)).filter(Boolean) as HealthCheck[];

  async function syncGitHubHistory() {
    const project = projects.find((item) => item.id === selectedProject) || projects.find((item) => item.repository?.includes("/"));
    if (!project?.repository?.includes("/")) {
      setMessage("Selecione um projeto com repositório GitHub configurado.");
      return;
    }
    setSyncingGitHub(true);
    setMessage("");
    try {
      const base = `https://api.github.com/repos/${project.repository}`;
      const response = await fetch(`${base}/commits?per_page=20`);
      if (!response.ok) throw new Error("Não foi possível consultar o GitHub.");
      const commits = await response.json() as Array<{ sha: string; html_url: string; commit: { message: string; author?: { date?: string } } }>;
      let imported = 0;
      for (const commit of commits) {
        const existing = changes.some((item) => item.project_id === project.id && item.commit_sha === commit.sha);
        if (existing) continue;
        const detailResponse = await fetch(`${base}/commits/${commit.sha}`);
        const detail = detailResponse.ok ? await detailResponse.json() as { files?: Array<{ filename: string }> } : { files: [] };
        const { data, error } = await amtSupabase.from("development_changes").insert({
          project_id: project.id,
          change_type: "github_commit",
          summary: commit.commit.message.split("\\n")[0].slice(0, 180),
          files: (detail.files ?? []).map((file) => file.filename).slice(0, 100),
          commit_sha: commit.sha,
          commit_url: commit.html_url,
          reason: "Sincronizado automaticamente do GitHub.",
          status: "concluida",
          created_at: commit.commit.author?.date || new Date().toISOString(),
        }).select("id,project_id,summary,change_type,files,commit_sha,commit_url,reason,status,created_at").single();
        if (!error && data) {
          setChanges((items) => [data as Change, ...items]);
          imported++;
        }
      }
      setMessage(imported ? `${imported} alterações importadas do GitHub.` : "O histórico já está sincronizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao sincronizar o GitHub.");
    } finally {
      setSyncingGitHub(false);
    }
  }

  function generateDevelopmentContext() {
    const project = projects.find((item) => item.id === (contextProjectId || selectedProject));
    if (!project) {
      setMessage("Selecione um projeto para gerar o contexto.");
      return;
    }
    const projectIssues = issues.filter((item) => item.project_id === project.id);
    const projectChanges = changes.filter((item) => item.project_id === project.id).slice(0, 10);
    const projectDeployments = deployments.filter((item) => item.project_id === project.id).slice(0, 5);
    const latest = health.find((item) => item.project_id === project.id);
    const lines = [
      "# Contexto de Desenvolvimento — " + project.name,
      "",
      "## Projeto",
      "- Sistema: " + project.name,
      "- Repositório: " + (project.repository || "não configurado"),
      "- Branch: " + (project.branch || "não configurada"),
      "- Produção: " + (project.production_url || "não configurada"),
      "- Stack: " + (project.stack || "não informada"),
      "- Status: " + project.status,
      "",
      "## Problemas em aberto",
      ...(projectIssues.filter((item) => !["corrigido", "validado"].includes(item.status)).map((item) => "- [" + item.priority.toUpperCase() + "] " + item.title + " — " + (item.module || "módulo não informado") + " — " + statusLabel(item.status))),
      ...(projectIssues.filter((item) => !["corrigido", "validado"].includes(item.status)).length ? [] : ["- Nenhum problema em aberto."]),
      "",
      "## Últimas alterações",
      ...(projectChanges.length ? projectChanges.map((item) => "- " + item.summary + " — commit " + (item.commit_sha ? item.commit_sha.slice(0, 7) : "não informado") + (item.files?.length ? " — arquivos: " + item.files.slice(0, 8).join(", ") : "")) : ["- Nenhuma alteração registrada."]),
      "",
      "## Últimos deploys",
      ...(projectDeployments.length ? projectDeployments.map((item) => "- " + statusLabel(item.status) + " — " + (item.commit_sha ? item.commit_sha.slice(0, 7) : "sem commit") + " — " + item.environment) : ["- Nenhum deploy registrado."]),
      "",
      "## Health Check",
      "- Estado: " + (latest ? statusLabel(latest.status) : "não verificado"),
      "- HTTP: " + (latest?.status_code ?? "—"),
      "- Resposta: " + (latest?.response_ms != null ? latest.response_ms + " ms" : "—"),
      "",
      "## Orientação para a próxima tarefa",
      "Preservar as funcionalidades existentes. Alterar somente o necessário para a tarefa solicitada. Antes de modificar código, verificar os arquivos e o fluxo atual. Após concluir, registrar o commit e relacioná-lo a este projeto.",
    ];
    setContextText(lines.join("\\n"));
    setTab("contexto");
  }

  async function copyDevelopmentContext() {
    if (!contextText) return;
    await navigator.clipboard.writeText(contextText);
    setMessage("Contexto copiado para a área de transferência.");
  }

  async function linkChangeToIssue(changeId: string, issueId: string) {
    const { data, error } = await amtSupabase.from("development_changes").update({ issue_id: issueId || null }).eq("id", changeId).select("id,project_id,summary,change_type,files,commit_sha,commit_url,reason,status,created_at,issue_id").single();
    if (error || !data) { setMessage("Não foi possível vincular a alteração."); return; }
    setChanges((items) => items.map((item) => item.id === changeId ? data as Change : item));
    setMessage("Alteração vinculada ao problema.");
  }

  async function createIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!issueForm.title.trim() || !issueForm.project_id) return;
    const { data, error } = await amtSupabase.from("development_issues").insert({
      ...issueForm,
      title: issueForm.title.trim(),
      description: issueForm.description.trim() || null,
      module: issueForm.module.trim() || null,
    }).select("id,project_id,title,description,module,priority,status,created_at").single();
    if (error || !data) {
      setMessage(error?.message ?? "Não foi possível registrar o problema.");
      return;
    }
    setIssues((items) => [data as Issue, ...items]);
    setIssueForm({ title: "", project_id: selectedProject || projects[0]?.id || "", module: "", priority: "media", description: "" });
    setShowIssueForm(false);
    setMessage("Problema registrado.");
    setTab("problemas");
  }

  async function updateIssueStatus(id: string, status: string) {
    const { data, error } = await amtSupabase.from("development_issues").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("id,project_id,title,description,module,priority,status,created_at").single();
    if (error || !data) {
      setMessage("Não foi possível atualizar o problema.");
      return;
    }
    setIssues((items) => items.map((item) => item.id === id ? data as Issue : item));
  }

  async function runHealthCheck(project: Project) {
    const url = project.production_url;
    if (!url) return;
    const started = performance.now();
    let status = "offline";
    let statusCode: number | null = null;
    try {
      const response = await fetch(url, { method: "GET", mode: "cors" });
      statusCode = response.status;
      status = response.ok ? "online" : "degradado";
    } catch {
      status = "unknown";
    }
    const responseMs = Math.round(performance.now() - started);
    const { data, error } = await amtSupabase.from("system_health_checks").insert({
      project_id: project.id,
      check_type: "http",
      status,
      response_ms: responseMs,
      status_code: statusCode,
      url,
      details: { checked_from: "control_center_browser" },
    }).select("id,project_id,status,response_ms,status_code,url,checked_at").single();
    if (!error && data) setHealth((items) => [data as HealthCheck, ...items].slice(0, 100));
    else setMessage("O teste foi executado, mas o resultado não pôde ser salvo.");
  }

  const statusLabel = (value: string) => ({
    aberto: "Aberto",
    em_analise: "Em análise",
    em_desenvolvimento: "Em desenvolvimento",
    corrigido: "Corrigido",
    validado: "Validado",
    online: "Online",
    offline: "Offline",
    degradado: "Degradado",
    unknown: "Não verificado",
    sucesso: "Sucesso",
    falha: "Falha",
    pendente: "Pendente",
    em_andamento: "Em andamento",
  } as Record<string, string>)[value] ?? value;

  const badge = (value: string) => {
    const positive = ["online", "sucesso", "validado", "corrigido"].includes(value);
    const negative = ["offline", "falha", "critica"].includes(value);
    return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${positive ? "bg-emerald-50 text-emerald-700" : negative ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(value)}</span>;
  };

  if (loading) return <section className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Carregando Central de Desenvolvimento...</section>;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Desenvolvimento</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Central de Desenvolvimento</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Organize manutenção, problemas, alterações, deploys e saúde dos sistemas em um único lugar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void syncGitHubHistory()} disabled={syncingGitHub} className="gap-2 bg-white text-slate-900 hover:bg-slate-100"><GitBranch className="h-4 w-4" /> {syncingGitHub ? "Sincronizando..." : "Sincronizar GitHub"}</Button><Button type="button" variant="outline" onClick={generateDevelopmentContext} className="gap-2 bg-white text-slate-900 hover:bg-slate-100"><Wrench className="h-4 w-4" /> Contexto para desenvolvimento</Button><Button type="button" variant="outline" onClick={() => void loadAll()} className="gap-2 bg-white text-slate-900 hover:bg-slate-100"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
            <Button type="button" onClick={() => { setIssueForm((v) => ({ ...v, project_id: selectedProject || projects[0]?.id || "" })); setShowIssueForm(true); }} className="gap-2 bg-black text-white hover:bg-slate-900"><Plus className="h-4 w-4" /> Novo problema</Button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Projetos", projects.length, Code2],
            ["Problemas abertos", openIssues, AlertCircle],
            ["Alterações", changes.length, History],
            ["Deploys com falha", failedDeploys, Server],
            ["Health checks", latestHealth.length, Activity],
          ].map(([label, value, Icon]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4"><Icon className="h-4 w-4 text-blue-700" /><p className="mt-3 text-2xl font-semibold text-slate-950">{String(value)}</p><p className="mt-1 text-xs text-slate-500">{String(label)}</p></div>)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${tab === id ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icon className="h-4 w-4" />{label}</button>)}
      </div>

      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}

      {tab === "projetos" && <div className="grid gap-4 lg:grid-cols-3">{projects.map((project) => <article key={project.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="rounded-lg bg-slate-100 p-2.5"><Code2 className="h-5 w-5 text-slate-900" /></div>{badge(project.status)}</div><h3 className="mt-4 font-semibold text-slate-950">{project.name}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{project.description || "Sem descrição."}</p><dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-400">Stack</dt><dd className="text-right text-slate-700">{project.stack || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Branch</dt><dd className="text-right text-slate-700">{project.branch || "—"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Repositório</dt><dd className="text-right text-slate-700">{project.repository || "—"}</dd></div></dl><div className="mt-5 flex gap-2">{project.production_url && <a href={project.production_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">Abrir produção <ExternalLink className="h-3.5 w-3.5" /></a>}{project.repository && project.repository.includes("/") && <a href={`https://github.com/${project.repository}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">GitHub <GitBranch className="h-3.5 w-3.5" /></a>}</div></article>)}</div>}

      {tab === "problemas" && <div className="space-y-4">{issues.length === 0 ? <Empty text="Nenhum problema registrado." /> : issues.map((issue) => <article key={issue.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{issue.title}</h3>{badge(issue.priority)}</div><p className="mt-1 text-xs text-slate-500">{projectMap.get(issue.project_id)?.name || "Projeto"}{issue.module ? ` · ${issue.module}` : ""} · {new Date(issue.created_at).toLocaleString("pt-BR")}</p>{issue.description && <p className="mt-3 text-sm leading-6 text-slate-600">{issue.description}</p>}</div><select value={issue.status} onChange={(e) => void updateIssueStatus(issue.id, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="aberto">Aberto</option><option value="em_analise">Em análise</option><option value="em_desenvolvimento">Em desenvolvimento</option><option value="corrigido">Corrigido</option><option value="validado">Validado</option></select></div></article>)}</div>}

      {tab === "alteracoes" && <ListTable title="Histórico de alterações" empty="Nenhuma alteração registrada." rows={changes} render={(change) => <div key={change.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 lg:grid-cols-[1.5fr_1fr_180px]"><div><p className="font-medium text-slate-950">{change.summary}</p><p className="mt-1 text-xs text-slate-500">{projectMap.get(change.project_id)?.name || "Projeto"} · {change.change_type}</p></div><div className="text-xs text-slate-600">{change.commit_sha ? `commit ${change.commit_sha.slice(0, 7)}` : "Commit não informado"}{change.reason ? ` · ${change.reason}` : ""}<div className="mt-2"><select value={change.issue_id || ""} onChange={(e) => void linkChangeToIssue(change.id, e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"><option value="">Sem problema vinculado</option>{issues.filter((item) => item.project_id === change.project_id && !["validado"].includes(item.status)).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div></div><div className="text-xs text-slate-400">{new Date(change.created_at).toLocaleString("pt-BR")}</div></div>} />}

      {tab === "deploys" && <ListTable title="Histórico de deploys" empty="Nenhum deploy registrado." rows={deployments} render={(deployment) => <div key={deployment.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 lg:grid-cols-[1.2fr_1fr_140px_180px]"><div><p className="font-medium text-slate-950">{projectMap.get(deployment.project_id)?.name || "Projeto"}</p><p className="mt-1 text-xs text-slate-500">{deployment.provider} · {deployment.environment}</p></div><div className="text-xs text-slate-600">{deployment.commit_sha ? deployment.commit_sha.slice(0, 7) : "Sem commit"}</div><div>{badge(deployment.status)}</div><div className="text-xs text-slate-400">{new Date(deployment.created_at).toLocaleString("pt-BR")}</div></div>} />}

      {tab === "contexto" && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Preparação</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Contexto para Desenvolvimento</h3><p className="mt-1 text-sm text-slate-500">Gere um resumo pronto para iniciar uma tarefa de manutenção ou evolução aqui.</p></div>
          <div className="flex gap-2"><select value={contextProjectId || selectedProject} onChange={(e) => { setContextProjectId(e.target.value); setSelectedProject(e.target.value); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><Button type="button" onClick={generateDevelopmentContext} className="bg-black text-white hover:bg-slate-900">Gerar</Button></div>
        </div>
        {contextText ? <div className="mt-5"><textarea readOnly value={contextText} className="min-h-[420px] w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-800 outline-none" /><div className="mt-3 flex justify-end"><Button type="button" onClick={() => void copyDevelopmentContext()} className="bg-black text-white hover:bg-slate-900">Copiar contexto</Button></div></div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">Selecione um projeto e clique em Gerar.</div>}
      </section>}

      {tab === "saude" && <div className="grid gap-4 lg:grid-cols-2">{projects.map((project) => { const latest = health.find((h) => h.project_id === project.id); return <article key={project.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-lg bg-slate-100 p-2.5"><Activity className="h-5 w-5 text-slate-900" /></div><div><h3 className="font-semibold text-slate-950">{project.name}</h3><p className="text-xs text-slate-500">{project.production_url || "URL não configurada"}</p></div></div>{latest ? badge(latest.status) : badge("unknown")}</div>{latest && <div className="mt-5 grid grid-cols-3 gap-3 text-xs"><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-400">HTTP</p><p className="mt-1 font-medium text-slate-700">{latest.status_code ?? "—"}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-400">Resposta</p><p className="mt-1 font-medium text-slate-700">{latest.response_ms != null ? `${latest.response_ms} ms` : "—"}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-400">Verificado</p><p className="mt-1 font-medium text-slate-700">{new Date(latest.checked_at).toLocaleTimeString("pt-BR")}</p></div></div>}<Button type="button" size="sm" variant="outline" onClick={() => void runHealthCheck(project)} className="mt-5 gap-2 bg-white text-slate-900 hover:bg-slate-100"><Activity className="h-4 w-4" /> Testar agora</Button></article>})}</div>}

      {showIssueForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><form onSubmit={createIssue} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-950">Registrar problema</h3><p className="mt-1 text-sm text-slate-500">Crie um registro para orientar a próxima manutenção.</p></div><button type="button" onClick={() => setShowIssueForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><XCircle className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><input required value={issueForm.title} onChange={(e) => setIssueForm((v) => ({ ...v, title: e.target.value }))} placeholder="Título do problema" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500" /><div className="grid gap-4 sm:grid-cols-2"><select value={issueForm.project_id} onChange={(e) => setIssueForm((v) => ({ ...v, project_id: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950"><option value="">Selecione o projeto</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={issueForm.priority} onChange={(e) => setIssueForm((v) => ({ ...v, priority: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950"><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></div><input value={issueForm.module} onChange={(e) => setIssueForm((v) => ({ ...v, module: e.target.value }))} placeholder="Módulo / tela / área" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500" /><textarea value={issueForm.description} onChange={(e) => setIssueForm((v) => ({ ...v, description: e.target.value }))} placeholder="Descreva o problema, comportamento atual ou contexto para desenvolvimento." className="min-h-32 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500" /></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowIssueForm(false)} className="bg-white text-slate-900 hover:bg-slate-100">Cancelar</Button><Button type="submit" className="bg-black text-white hover:bg-slate-900">Salvar problema</Button></div></form></div>}
    </section>
  );
}

function ListTable({ title, empty, rows, render }: { title: string; empty: string; rows: unknown[]; render: (row: any) => React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold text-slate-950">{title}</h3></div>{rows.length ? rows.map(render) : <div className="p-10 text-center text-sm text-slate-500">{empty}</div>}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{text}</div>;
}
