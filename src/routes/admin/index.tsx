import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Code2,
  ExternalLink,
  FileText,
  GitBranch,
  Globe2,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Users,
  Wrench,
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminProfile, getAdminSession, signOutAdmin } from "@/lib/amt-admin-auth";
import { amtSupabase } from "@/integrations/amt-supabase/client";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Control Center — AMT Sistemas" },
      { name: "description", content: "Centro administrativo operacional da AMT Sistemas." },
    ],
  }),
  component: AdminDashboard,
});

const systems = [
  { name: "AB Academy", description: "Plataforma integrada de gestão acadêmica.", status: "Integrado", href: "https://abacademyidiomas.com.br/aluno", icon: Globe2 },
  { name: "AMT Dojo Manager", description: "SaaS de gestão para academias e dojos.", status: "Acesso externo", href: "https://dojomanager.amtfightwear.com.br", icon: Boxes },
  { name: "AMT Fight Wear", description: "E-commerce e operação de fight wear.", status: "Acesso externo", href: "https://amtfightwear.com.br", icon: BriefcaseBusiness },
];

const modules = [
  { label: "Sistemas", icon: Boxes, to: "/admin/sistemas" },
  { label: "Leads", icon: Users, to: "/admin/leads" },
  { label: "Formulários", icon: FileText, to: "/admin/formularios" },
  { label: "Ferramentas", icon: Wrench, to: "/admin/ferramentas" },
  { label: "Auditoria", icon: Activity, to: "/admin/auditoria" },
];

const kpis = [
  { label: "Sistemas", value: "03", detail: "01 integrado · 02 externos", icon: Boxes },
  { label: "Leads", value: "12", detail: "Dados demonstrativos", icon: Users },
  { label: "Formulários", value: "08", detail: "Últimos 30 dias · demo", icon: FileText },
  { label: "Alertas", value: "03", detail: "Painel preparado", icon: Bell },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState("Dashboard");

  useEffect(() => {
    let active = true;
    void getAdminSession()
      .then(async (session) => {
        if (!active) return;
        if (!session) {
          navigate({ to: "/admin/login" });
          return;
        }
        const profile = await getAdminProfile(session.user.id);
        if (!profile) {
          await signOutAdmin();
          navigate({ to: "/admin/login" });
          return;
        }
        setUserEmail(profile.email);
        setLoading(false);
      })
      .catch(async (error) => {
        console.error(error);
        await signOutAdmin().catch(() => undefined);
        if (active) navigate({ to: "/admin/login" });
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    await signOutAdmin();
    navigate({ to: "/admin/login" });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">Validando sessão...</div>;
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-20" : "w-72"}`}>
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <img src="/amt-sistemas-logo.png" alt="AMT Sistemas" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <p className="font-semibold">AMT Sistemas</p>
              <p className="text-[11px] text-slate-400">Control Center</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            <SidebarButton icon={LayoutDashboard} label="Dashboard" active={activeModule === "Dashboard"} collapsed={sidebarCollapsed} onClick={() => setActiveModule("Dashboard")} />
            {modules.map((item) => <SidebarButton key={item.label} icon={item.icon} label={item.label} active={activeModule === item.label} collapsed={sidebarCollapsed} onClick={() => setActiveModule(item.label)} />)}
          </nav>

          <div className="border-t border-white/10 p-3">
            {!sidebarCollapsed && <div className="mb-3 rounded-xl bg-white/5 p-3"><p className="truncate text-xs text-slate-300">{userEmail}</p><p className="mt-1 text-[11px] text-slate-500">Sessão administrativa</p></div>}
            <Button variant="ghost" onClick={handleLogout} className={`w-full gap-2 text-slate-300 hover:bg-white/10 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "justify-start"}`} title="Sair"><LogOut className="h-4 w-4" />{!sidebarCollapsed && "Sair"}</Button>
            <Button variant="ghost" onClick={() => setSidebarCollapsed((value) => !value)} className={`mt-1 w-full gap-2 text-slate-400 hover:bg-white/10 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "justify-start"}`} title={sidebarCollapsed ? "Expandir sidebar" : "Minimizar menu"}>
              {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              {!sidebarCollapsed && "Minimizar menu"}
            </Button>
          </div>
        </aside>

        <section className={`min-w-0 flex-1 transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
          <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Operação</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{activeModule}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">Sistema operacional</span>
              <Button size="sm" variant="outline" onClick={handleLogout} className="gap-2 lg:hidden">
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </header>

          <div className="space-y-8 p-5 sm:p-8">
            {activeModule !== "Dashboard" && <ModuleWorkspace module={activeModule} />}
            {activeModule === "Dashboard" && <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="border-slate-200 bg-white text-slate-950 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{item.label}</p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Icon className="h-5 w-5" /></div>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">{item.detail}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Sistemas</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Visão rápida dos produtos e plataformas.</p>
                  </div>
                  <button type="button" onClick={() => setActiveModule("Sistemas")} className="text-sm font-medium text-blue-700 hover:text-blue-800">Ver todos</button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systems.map((system) => {
                    const Icon = system.icon;
                    return (
                      <div key={system.name} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                        <div className="rounded-lg bg-slate-100 p-2.5"><Icon className="h-5 w-5 text-slate-700" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{system.name}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{system.status}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{system.description}</p>
                        </div>
                        <a href={system.href} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-700" aria-label={"Abrir " + system.name}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Acessos rápidos</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Ferramentas centrais da operação.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <QuickLink href="https://github.com/profandreteixeira91-oss" icon={GitBranch} label="GitHub" />
                  <QuickLink href="https://supabase.com/dashboard" icon={Code2} label="Supabase" />
                  <QuickLink href="https://dash.cloudflare.com/" icon={Globe2} label="Cloudflare" />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Atividade recente</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Estrutura preparada para o futuro log de auditoria.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ["Sistema criado", "AMT Control Center", "Agora"],
                    ["Projeto conectado", "AB Academy", "Hoje"],
                    ["Formulário recebido", "Novo lead comercial", "Hoje"],
                  ].map(([title, detail, time]) => (
                    <div key={title} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-slate-500">{detail}</p>
                      </div>
                      <span className="text-xs text-slate-400">{time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Próximos módulos</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Áreas já previstas na arquitetura do Control Center.</p>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["Leads e CRM", Users],
                    ["Infraestrutura", GitBranch],
                    ["Auditoria", Activity],
                    ["Financeiro", CircleDollarSign],
                    ["Métricas", BarChart3],
                  ].map(([label, Icon]) => (
                    <div key={String(label)} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                      <Icon className="h-4 w-4 text-blue-700" /> {label}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            </>}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className="h-4 w-4" />
              Os indicadores desta primeira versão são demonstrativos e serão substituídos por dados do Supabase após a integração do backend.
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarButton({ icon: Icon, label, active, collapsed, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} title={collapsed ? label : undefined} className={`flex w-full items-center rounded-xl text-left text-sm transition-colors ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"} ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </button>
  );
}

function ModuleWorkspace({ module }: { module: string }) {
  if (module === "Leads") return <LeadsWorkspace />;
  if (module === "Sistemas") return <SystemsWorkspace />;
  if (module === "Formulários") return <FormsWorkspace />;
  if (module === "Ferramentas") return <ToolsWorkspace />;
  if (module === "Auditoria") return <AuditWorkspace />;
  const descriptions: Record<string, string> = {
    Sistemas: "Gerencie os sistemas e integrações do ecossistema AMT.",
    Formulários: "Acompanhe formulários e solicitações recebidas.",
    Ferramentas: "Ferramentas administrativas e operacionais.",
    Auditoria: "Histórico de ações e eventos administrativos.",
  };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{module}</h2>
      <p className="mt-1 text-sm text-slate-500">{descriptions[module] ?? "Módulo administrativo."}</p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-950">Área pronta para receber os dados e funcionalidades deste módulo.</div>
    </section>
  );
}


function ToolsWorkspace() {
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [uuid, setUuid] = useState(() => crypto.randomUUID());
  const [urlInput, setUrlInput] = useState("");
  const [urlOutput, setUrlOutput] = useState("");
  const [urlMode, setUrlMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState("");

  async function copyValue(value: string, label: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  function formatJson(compact = false) {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, compact ? 0 : 2));
    } catch {
      setJsonOutput("");
      setJsonError("JSON inválido. Verifique aspas, vírgulas e chaves.");
    }
  }

  function transformUrl() {
    try {
      setUrlOutput(urlMode === "encode" ? encodeURIComponent(urlInput) : decodeURIComponent(urlInput));
    } catch {
      setUrlOutput("Não foi possível processar o valor informado.");
    }
  }

  const ToolHeader = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) => (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Icon className="h-4 w-4" /></div>
      <div><h3 className="font-semibold text-slate-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Ferramentas</h2>
        <p className="mt-1 text-sm text-slate-500">Utilitários rápidos para desenvolvimento, operação e suporte do ecossistema AMT.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={Code2} title="Formatador de JSON" description="Valide, organize ou compacte objetos JSON antes de usar em APIs, configurações ou registros." />
          <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='{"exemplo": true}' className="mt-5 min-h-40 w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-950 outline-none focus:border-blue-500" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => formatJson(false)}>Formatar</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => formatJson(true)}>Compactar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setJsonInput(""); setJsonOutput(""); setJsonError(""); }}>Limpar</Button>
          </div>
          {jsonError && <p className="mt-3 text-xs font-medium text-red-600">{jsonError}</p>}
          {jsonOutput && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Resultado</span><button type="button" onClick={() => void copyValue(jsonOutput, "json")} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">{copied === "json" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === "json" ? "Copiado" : "Copiar"}</button></div><pre className="max-h-56 overflow-auto rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-800">{jsonOutput}</pre></div>}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={RefreshCw} title="Gerador de UUID" description="Gere identificadores UUID v4 para testes, registros técnicos e operações administrativas." />
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm break-all text-slate-950">{uuid}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setUuid(crypto.randomUUID())}>Novo UUID</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyValue(uuid, "uuid")} className="gap-1.5"><Copy className="h-3.5 w-3.5" />{copied === "uuid" ? "Copiado" : "Copiar"}</Button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={ExternalLink} title="Codificador de URL" description="Converta parâmetros e valores para uso seguro em URLs ou decodifique valores já existentes." />
          <textarea value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="texto ou parâmetro de URL" className="mt-5 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={urlMode} onChange={(e) => setUrlMode(e.target.value as "encode" | "decode")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="encode">Codificar</option><option value="decode">Decodificar</option></select>
            <Button type="button" size="sm" onClick={transformUrl}>Processar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setUrlInput(""); setUrlOutput(""); }}>Limpar</Button>
          </div>
          {urlOutput && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Resultado</span><button type="button" onClick={() => void copyValue(urlOutput, "url")} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">{copied === "url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === "url" ? "Copiado" : "Copiar"}</button></div><div className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">{urlOutput}</div></div>}
        </article>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><Wrench className="mt-0.5 h-4 w-4 text-blue-700" /><div><h3 className="text-sm font-semibold text-slate-950">Uso seguro</h3><p className="mt-1 text-xs leading-5 text-slate-500">Estas ferramentas executam processamento local no navegador. Elas não alteram dados do ecossistema por conta própria.</p></div></div>
      </div>
    </section>
  );
}


function AuditWorkspace() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("todos");
  const [resourceFilter, setResourceFilter] = useState("todos");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadLogs() {
    setLoading(true);
    const { data, error } = await amtSupabase
      .from("audit_logs")
      .select("id,actor_user_id,action,resource_type,resource_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      setMessage("Não foi possível carregar o histórico de auditoria.");
    } else {
      setLogs((data ?? []) as AuditLog[]);
    }
    setLoading(false);
  }

  useEffect(() => { void loadLogs(); }, []);

  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const resources = Array.from(new Set(logs.map((log) => log.resource_type).filter(Boolean) as string[])).sort();

  const filtered = logs.filter((log) => {
    const haystack = [
      log.action,
      log.resource_type ?? "",
      log.resource_id ?? "",
      log.actor_user_id ?? "",
      JSON.stringify(log.metadata),
    ].join(" ").toLowerCase();
    return (
      (actionFilter === "todos" || log.action === actionFilter) &&
      (resourceFilter === "todos" || log.resource_type === resourceFilter) &&
      haystack.includes(search.toLowerCase())
    );
  });

  const today = new Date();
  const todayCount = logs.filter((log) => {
    const date = new Date(log.created_at);
    return date.toDateString() === today.toDateString();
  }).length;
  const uniqueActors = new Set(logs.map((log) => log.actor_user_id).filter(Boolean)).size;

  function formatAction(action: string) {
    return action.replace(/[._]/g, " ");
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Auditoria</h2>
          <p className="mt-1 text-sm text-slate-500">Histórico das ações administrativas registradas no Control Center.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadLogs()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Eventos carregados</p><p className="mt-2 text-2xl font-semibold text-slate-950">{logs.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Eventos hoje</p><p className="mt-2 text-2xl font-semibold text-slate-950">{todayCount}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Atores registrados</p><p className="mt-2 text-2xl font-semibold text-slate-950">{uniqueActors}</p></div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ação, recurso, ID ou usuário" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
        </label>
        <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950">
          <option value="todos">Todos os recursos</option>
          {resources.map((resource) => <option key={resource} value={resource}>{resource}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950">
          <option value="todos">Todas as ações</option>
          {actions.map((action) => <option key={action} value={action}>{formatAction(action)}</option>)}
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_150px] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-950">
            <span>Ação</span><span>Recurso</span><span>Data</span>
          </div>
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Carregando auditoria...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Nenhum evento encontrado.</div> : filtered.map((log) => (
            <button type="button" key={log.id} onClick={() => setSelected(log)} className="grid w-full grid-cols-[1.4fr_1fr_150px] gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-0 hover:bg-slate-50">
              <div><p className="font-medium text-slate-950">{formatAction(log.action)}</p><p className="mt-1 truncate text-xs text-slate-500">{log.actor_user_id || "Ator não identificado"}</p></div>
              <div><p className="text-sm text-slate-700">{log.resource_type || "—"}</p><p className="mt-1 truncate text-xs text-slate-400">{log.resource_id || "Sem ID"}</p></div>
              <div className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString("pt-BR")}</div>
            </button>
          ))}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">Selecione um evento para visualizar os detalhes.</div> : (
            <>
              <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Evento</p><h3 className="mt-1 font-semibold text-slate-950">{formatAction(selected.action)}</h3><p className="mt-1 text-xs text-slate-500">{new Date(selected.created_at).toLocaleString("pt-BR")}</p></div>
              <div className="mt-5 space-y-4 text-sm">
                <div><p className="text-xs text-slate-500">ID do evento</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{selected.id}</p></div>
                <div><p className="text-xs text-slate-500">Usuário responsável</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{selected.actor_user_id || "Não identificado"}</p></div>
                <div><p className="text-xs text-slate-500">Tipo de recurso</p><p className="mt-1 text-slate-950">{selected.resource_type || "Não informado"}</p></div>
                <div><p className="text-xs text-slate-500">ID do recurso</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{selected.resource_id || "Não informado"}</p></div>
                <div><p className="text-xs text-slate-500">Metadados</p><pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700">{JSON.stringify(selected.metadata, null, 2)}</pre></div>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function SystemsWorkspace() {
  const integrated = systems.filter((system) => system.status === "Integrado");
  const external = systems.filter((system) => system.status !== "Integrado");

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sistemas</h2>
            <p className="mt-1 text-sm text-slate-500">Visão centralizada dos sistemas que fazem parte do ecossistema AMT.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">{integrated.length} integrado</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{external.length} externos</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {systems.map((system) => {
          const Icon = system.icon;
          const isIntegrated = system.status === "Integrado";
          return (
            <article key={system.name} className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Icon className="h-6 w-6 text-slate-900" />
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${isIntegrated ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                  {system.status}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-950">{system.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{system.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">{isIntegrated ? "Conexão com o Control Center" : "Operação em sistema externo"}</span>
                <a href={system.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800">
                  Acessar <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold">Arquitetura de integração</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Integrados", "Dados e operações poderão ser centralizados no Control Center.", Globe2],
            ["Externos", "Acesso rápido sem assumir integração direta com sistemas independentes.", ExternalLink],
            ["Expansão", "Novos sistemas poderão ser adicionados sem alterar a navegação principal.", GitBranch],
          ].map(([title, description, Icon]) => (
            <div key={String(title)} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-950"><Icon className="h-4 w-4 text-blue-700" />{title}</div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{String(description)}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

type FormSubmission = { id: string; form_name: string; name: string; email: string | null; phone: string | null; source: string | null; status: string; payload: Record<string, unknown>; notes: string | null; created_at: string; updated_at: string };

function FormsWorkspace() {
  const [items, setItems] = useState<FormSubmission[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [formName, setFormName] = useState("todos");
  const [selected, setSelected] = useState<FormSubmission | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newItem, setNewItem] = useState({ form_name: "", name: "", email: "", phone: "", source: "", notes: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const { data, error } = await amtSupabase.from("form_submissions").select("*").order("created_at", { ascending: false });
    if (error) { setMessage("Não foi possível carregar as solicitações."); return; }
    setItems((data ?? []) as FormSubmission[]);
  }
  useEffect(() => { void load(); }, []);

  async function audit(action: string, id: string, metadata: Record<string, unknown>) {
    const { data } = await amtSupabase.auth.getSession();
    if (data.session) await amtSupabase.from("audit_logs").insert({ actor_user_id: data.session.user.id, action, resource_type: "form_submission", resource_id: id, metadata });
  }

  async function createSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.form_name.trim() || !newItem.name.trim()) return;
    setSaving(true); setMessage("");
    const payload = { ...newItem, form_name: newItem.form_name.trim(), name: newItem.name.trim(), email: newItem.email.trim() || null, phone: newItem.phone.trim() || null, source: newItem.source.trim() || null, notes: newItem.notes.trim() || null };
    const { data, error } = await amtSupabase.from("form_submissions").insert(payload).select("*").single();
    if (error || !data) setMessage(error?.message ?? "Não foi possível cadastrar a solicitação.");
    else {
      const item = data as FormSubmission; setItems((v) => [item, ...v]); await audit("form_submission.created", item.id, { form_name: item.form_name });
      setNewItem({ form_name: "", name: "", email: "", phone: "", source: "", notes: "" }); setShowNew(false); setMessage("Solicitação cadastrada.");
    }
    setSaving(false);
  }

  async function updateStatus(id: string, next: string) {
    const current = items.find((item) => item.id === id);
    const { data, error } = await amtSupabase.from("form_submissions").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error || !data) { setMessage("Não foi possível atualizar o status."); return; }
    const item = data as FormSubmission; setItems((v) => v.map((x) => x.id === id ? item : x)); if (selected?.id === id) setSelected(item);
    await audit("form_submission.status_changed", id, { from: current?.status, to: next });
  }

  async function remove(id: string) {
    if (!window.confirm("Arquivar/excluir esta solicitação?")) return;
    const { error } = await amtSupabase.from("form_submissions").delete().eq("id", id);
    if (error) { setMessage("Não foi possível remover a solicitação."); return; }
    await audit("form_submission.deleted", id, {}); setItems((v) => v.filter((x) => x.id !== id)); setSelected(null); setMessage("Solicitação removida.");
  }

  const counts = {
    total: items.length,
    novo: items.filter((x) => x.status === "novo").length,
    atendimento: items.filter((x) => x.status === "em_atendimento").length,
    concluido: items.filter((x) => x.status === "concluido").length,
    arquivado: items.filter((x) => x.status === "arquivado").length,
  };
  const formNames = Array.from(new Set(items.map((x) => x.form_name)));
  const filtered = items.filter((item) => {
    const haystack = [item.name, item.email ?? "", item.phone ?? "", item.source ?? "", item.form_name].join(" ").toLowerCase();
    return (status === "todos" || item.status === status) && (formName === "todos" || item.form_name === formName) && haystack.includes(search.toLowerCase());
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold">Formulários e solicitações</h2><p className="mt-1 text-sm text-slate-500">Centralize os contatos recebidos pelos formulários do ecossistema AMT.</p></div>
        <Button onClick={() => setShowNew((v) => !v)} className="gap-2 bg-blue-700 hover:bg-blue-800"><Plus className="h-4 w-4" /> Nova solicitação</Button>
      </div>
      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Total",counts.total],["Novas",counts.novo],["Em atendimento",counts.atendimento],["Concluídas",counts.concluido]].map(([label,value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{String(value)}</p></div>)}
      </div>
      {showNew && <form onSubmit={createSubmission} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div><h3 className="font-semibold">Cadastrar solicitação</h3><p className="mt-1 text-xs text-slate-500">Útil para registros manuais até os formulários públicos estarem integrados.</p></div><div />
        {([["form_name","Formulário *"],["name","Nome *"],["email","E-mail"],["phone","Telefone"],["source","Origem"]] as const).map(([key,label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input required={key==="form_name"||key==="name"} value={newItem[key]} onChange={(e) => setNewItem((v) => ({...v,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>)}
        <label className="sm:col-span-2 text-sm font-medium text-slate-700">Observações<textarea value={newItem.notes} onChange={(e) => setNewItem((v) => ({...v,notes:e.target.value}))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950" /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button></div>
      </form>}
      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, telefone ou formulário" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-950" /></label>
        <select value={formName} onChange={(e) => setFormName(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"><option value="todos">Todos os formulários</option>{formNames.map((name) => <option key={name} value={name}>{name}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"><option value="todos">Todos os status</option><option value="novo">Novo</option><option value="em_atendimento">Em atendimento</option><option value="concluido">Concluído</option><option value="arquivado">Arquivado</option></select>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.1fr_1fr_130px] gap-4 border-b border-slate-200 bg-white px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-950"><span>Contato</span><span>Formulário</span><span>Status</span></div>
          {filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Nenhuma solicitação encontrada.</div> : filtered.map((item) => <button type="button" key={item.id} onClick={() => setSelected(item)} className="grid w-full grid-cols-[1.1fr_1fr_130px] gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-0 hover:bg-slate-50"><div><p className="font-medium text-slate-950">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.email || item.phone || "Sem contato"} · {new Date(item.created_at).toLocaleDateString("pt-BR")}</p></div><div className="truncate text-sm text-slate-600">{item.form_name}</div><span className="self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.status.replace("_"," ")}</span></button>)}
        </div>
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">Selecione uma solicitação para visualizar os detalhes.</div> : <>
            <div><h3 className="font-semibold text-slate-950">{selected.name}</h3><p className="mt-1 text-xs text-slate-500">{selected.form_name} · {new Date(selected.created_at).toLocaleString("pt-BR")}</p></div>
            <div className="mt-5 space-y-4 text-sm">
              <div><p className="text-xs text-slate-500">E-mail</p><p className="mt-1 text-slate-950">{selected.email || "Não informado"}</p></div>
              <div><p className="text-xs text-slate-500">Telefone</p><p className="mt-1 text-slate-950">{selected.phone || "Não informado"}</p></div>
              <div><p className="text-xs text-slate-500">Origem</p><p className="mt-1 text-slate-950">{selected.source || "Não informada"}</p></div>
              <div><p className="text-xs text-slate-500">Dados enviados</p><pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-2 text-xs text-slate-700">{JSON.stringify(selected.payload, null, 2)}</pre></div>
              <div><p className="text-xs text-slate-500">Observações</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.notes || "Nenhuma."}</p></div>
              <label className="block"><p className="text-xs text-slate-500">Status</p><select value={selected.status} onChange={(e) => void updateStatus(selected.id,e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="novo">Novo</option><option value="em_atendimento">Em atendimento</option><option value="concluido">Concluído</option><option value="arquivado">Arquivado</option></select></label>
              <button type="button" onClick={() => void remove(selected.id)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Excluir registro</button>
            </div>
          </>}
        </aside>
      </div>
    </section>
  );
}

type Lead = { id: string; name: string; email: string | null; phone: string | null; source: string | null; status: string; notes: string | null; created_at: string };

function LeadsWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const emptyForm = { name: "", email: "", phone: "", source: "", notes: "", status: "novo" };
  const [form, setForm] = useState(emptyForm);

  async function loadLeads() {
    const { data, error } = await amtSupabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) { setMessage("Não foi possível carregar os leads."); return; }
    setLeads((data ?? []) as Lead[]);
  }

  useEffect(() => { void loadLeads(); }, []);

  async function writeAudit(action: string, resourceId: string, metadata: Record<string, unknown>) {
    const session = await amtSupabase.auth.getSession();
    if (!session.data.session) return;
    await amtSupabase.from("audit_logs").insert({
      actor_user_id: session.data.session.user.id,
      action,
      resource_type: "lead",
      resource_id: resourceId,
      metadata,
    });
  }

  async function saveLead(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setMessage("");
    const payload = { ...form, name: form.name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null, source: form.source.trim() || null, notes: form.notes.trim() || null };
    const result = selectedLead
      ? await amtSupabase.from("leads").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", selectedLead.id).select("*").single()
      : await amtSupabase.from("leads").insert(payload).select("*").single();

    if (result.error || !result.data) {
      setMessage(result.error?.message ?? "Não foi possível salvar o lead.");
    } else {
      const lead = result.data as Lead;
      setLeads((current) => selectedLead ? current.map((item) => item.id === lead.id ? lead : item) : [lead, ...current]);
      await writeAudit(selectedLead ? "lead.updated" : "lead.created", lead.id, { name: lead.name, status: lead.status });
      setSelectedLead(null);
      setShowForm(false);
      setForm(emptyForm);
      setMessage(selectedLead ? "Lead atualizado." : "Lead cadastrado.");
    }
    setSaving(false);
  }

  async function changeStatus(id: string, nextStatus: string) {
    const current = leads.find((lead) => lead.id === id);
    const { data, error } = await amtSupabase.from("leads").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error || !data) { setMessage("Não foi possível atualizar o status."); return; }
    const lead = data as Lead;
    setLeads((items) => items.map((item) => item.id === id ? lead : item));
    if (selectedLead?.id === id) setSelectedLead(lead);
    await writeAudit("lead.status_changed", id, { from: current?.status, to: nextStatus });
  }

  async function deleteLead(id: string) {
    if (!window.confirm("Excluir este lead? Essa ação não poderá ser desfeita.")) return;
    const { error } = await amtSupabase.from("leads").delete().eq("id", id);
    if (error) { setMessage("Não foi possível excluir o lead."); return; }
    await writeAudit("lead.deleted", id, {});
    setLeads((items) => items.filter((item) => item.id !== id));
    setSelectedLead(null);
    setMessage("Lead excluído.");
  }

  function editLead(lead: Lead) {
    setSelectedLead(lead);
    setForm({ name: lead.name, email: lead.email ?? "", phone: lead.phone ?? "", source: lead.source ?? "", notes: lead.notes ?? "", status: lead.status });
    setShowForm(true);
  }

  const counts = {
    total: leads.length,
    novo: leads.filter((l) => l.status === "novo").length,
    contatado: leads.filter((l) => l.status === "contatado").length,
    qualificado: leads.filter((l) => l.status === "qualificado").length,
    convertido: leads.filter((l) => l.status === "convertido").length,
    perdido: leads.filter((l) => l.status === "perdido").length,
  };
  const filtered = leads.filter((lead) => {
    const text = [lead.name, lead.email ?? "", lead.phone ?? "", lead.source ?? ""].join(" ").toLowerCase();
    return (status === "todos" || lead.status === status) && text.includes(search.toLowerCase());
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold">Leads e CRM</h2><p className="mt-1 text-sm text-slate-500">Central comercial para captura, acompanhamento e conversão de oportunidades.</p></div>
        <Button onClick={() => { setSelectedLead(null); setForm(emptyForm); setShowForm(true); }} className="gap-2 bg-blue-700 hover:bg-blue-800"><Plus className="h-4 w-4" /> Novo lead</Button>
      </div>

      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Total", counts.total], ["Novos", counts.novo], ["Em contato", counts.contatado],
          ["Qualificados", counts.qualificado], ["Convertidos", counts.convertido], ["Perdidos", counts.perdido],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{String(value)}</p></div>
        ))}
      </div>

      {showForm && <form onSubmit={saveLead} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2 flex items-center justify-between"><div><h3 className="font-semibold">{selectedLead ? "Editar lead" : "Novo lead"}</h3><p className="text-xs text-slate-500">Preencha os dados comerciais do contato.</p></div><button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-950">Fechar</button></div>
        {([["name","Nome *"],["email","E-mail"],["phone","Telefone"],["source","Origem"]] as const).map(([key,label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input required={key === "name"} value={form[key]} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>)}
        <label className="text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="novo">Novo</option><option value="contatado">Contatado</option><option value="qualificado">Qualificado</option><option value="convertido">Convertido</option><option value="perdido">Perdido</option></select></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Observações<textarea value={form.notes} onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>
        <div className="sm:col-span-2 flex gap-2"><Button type="submit" disabled={saving}>{saving ? "Salvando..." : selectedLead ? "Salvar alterações" : "Cadastrar lead"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
      </form>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, telefone ou origem" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950"><option value="todos">Todos os status</option><option value="novo">Novo</option><option value="contatado">Contatado</option><option value="qualificado">Qualificado</option><option value="convertido">Convertido</option><option value="perdido">Perdido</option></select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_140px] gap-4 border-b border-slate-200 bg-white px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-950"><span>Lead</span><span>Contato</span><span>Status</span></div>
          {filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Nenhum lead encontrado.</div> : filtered.map((lead) => (
            <button key={lead.id} type="button" onClick={() => setSelectedLead(lead)} className="grid w-full grid-cols-[1.4fr_1fr_140px] gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-0 hover:bg-slate-50">
              <div><p className="font-medium text-slate-950">{lead.name}</p><p className="mt-1 text-xs text-slate-500">{lead.source || "Origem não informada"} · {new Date(lead.created_at).toLocaleDateString("pt-BR")}</p></div>
              <div className="truncate text-sm text-slate-600">{lead.email || lead.phone || "—"}</div>
              <div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{lead.status}</span></div>
            </button>
          ))}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedLead ? <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">Selecione um lead para visualizar os detalhes.</div> : <>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{selectedLead.name}</h3><p className="mt-1 text-xs text-slate-500">Cadastrado em {new Date(selectedLead.created_at).toLocaleString("pt-BR")}</p></div><button type="button" onClick={() => editLead(selectedLead)} className="text-sm font-medium text-blue-700">Editar</button></div>
            <div className="mt-5 space-y-4 text-sm">
              <div><p className="text-xs text-slate-500">E-mail</p><p className="mt-1 text-slate-950">{selectedLead.email || "Não informado"}</p></div>
              <div><p className="text-xs text-slate-500">Telefone</p><p className="mt-1 text-slate-950">{selectedLead.phone || "Não informado"}</p></div>
              <div><p className="text-xs text-slate-500">Origem</p><p className="mt-1 text-slate-950">{selectedLead.source || "Não informada"}</p></div>
              <div><p className="text-xs text-slate-500">Observações</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{selectedLead.notes || "Nenhuma observação."}</p></div>
              <label className="block"><p className="text-xs text-slate-500">Status</p><select value={selectedLead.status} onChange={(e) => void changeStatus(selectedLead.id, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="novo">Novo</option><option value="contatado">Contatado</option><option value="qualificado">Qualificado</option><option value="convertido">Convertido</option><option value="perdido">Perdido</option></select></label>
              <button type="button" onClick={() => void deleteLead(selectedLead.id)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Excluir lead</button>
            </div>
          </>}
        </aside>
      </div>
    </section>
  );
}


function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
      <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-blue-700" /> {label}</span>
      <ExternalLink className="h-4 w-4 text-slate-400" />
    </a>
  );
}
