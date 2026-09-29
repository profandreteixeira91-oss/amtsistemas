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
  { id: "ab-academy", name: "AB Academy", description: "Plataforma integrada de gestão acadêmica.", status: "Integrado", href: "https://abacademyidiomas.com.br/aluno", icon: Globe2, links: { site: "https://abacademyidiomas.com.br", github: "https://github.com/profandreteixeira91-oss/ab-academy", cloudflare: "https://dash.cloudflare.com/", supabase: "https://supabase.com/dashboard/project/vwmrxdzskvwojyfddjwd", operation: "https://abacademyidiomas.com.br/admin" }, capabilities: ["Site", "GitHub", "Cloudflare", "Supabase", "Administração"], githubRepo: "profandreteixeira91-oss/ab-academy" },
  { id: "dojo-manager", name: "AMT Dojo Manager", description: "SaaS de gestão para academias e dojos.", status: "Acesso externo", href: "https://dojomanager.amtfightwear.com.br", icon: Boxes, links: { site: "https://dojomanager.amtfightwear.com.br", github: "https://github.com/profandreteixeira91-oss", cloudflare: "https://dash.cloudflare.com/", supabase: "", operation: "https://dojomanager.amtfightwear.com.br" }, capabilities: ["Site", "GitHub", "Cloudflare", "Operação externa"] },
  { id: "fight-wear", name: "AMT Fight Wear", description: "E-commerce e operação de fight wear.", status: "Acesso externo", href: "https://amtfightwear.com.br", icon: BriefcaseBusiness, links: { site: "https://amtfightwear.com.br", github: "https://github.com/profandreteixeira91-oss", cloudflare: "https://dash.cloudflare.com/", supabase: "", operation: "https://amtfightwear.com.br" }, capabilities: ["Site", "GitHub", "Cloudflare", "Operação externa"] },
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
  const [selectedId, setSelectedId] = useState("ab-academy");
  const selected = systems.find((system) => system.id === selectedId) ?? systems[0];
  const [github, setGithub] = useState<{ loading: boolean; error: string; repo: any; commit: any; issues: number; prs: number }>({ loading: false, error: "", repo: null, commit: null, issues: 0, prs: 0 });

  useEffect(() => {
    if (!selected.githubRepo) { setGithub({ loading: false, error: "", repo: null, commit: null, issues: 0, prs: 0 }); return; }
    let active = true;
    setGithub((value) => ({ ...value, loading: true, error: "" }));
    const base = "https://api.github.com/repos/" + selected.githubRepo;
    Promise.all([
      fetch(base).then((r) => r.ok ? r.json() : Promise.reject(new Error("Não foi possível consultar o repositório."))),
      fetch(base + "/commits?per_page=1").then((r) => r.ok ? r.json() : Promise.reject(new Error("Não foi possível consultar os commits."))),
      fetch(base + "/issues?state=open&per_page=100").then((r) => r.ok ? r.json() : Promise.reject(new Error("Não foi possível consultar as issues."))),
    ]).then(([repo, commits, issues]) => {
      if (!active) return;
      setGithub({ loading: false, error: "", repo, commit: commits?.[0] ?? null, issues: (issues ?? []).filter((item: { pull_request?: unknown }) => !item.pull_request).length, prs: (issues ?? []).filter((item: { pull_request?: unknown }) => Boolean(item.pull_request)).length });
    }).catch((error) => {
      if (active) setGithub((value) => ({ ...value, loading: false, error: error instanceof Error ? error.message : "Falha ao consultar o GitHub." }));
    });
    return () => { active = false; };
  }, [selected]);

  if (!selected) return null;
  const isIntegrated = selected.status === "Integrado";
  const quickLinks = [["Site", selected.links.site, Globe2], ["GitHub", selected.links.github, GitBranch], ["Cloudflare", selected.links.cloudflare, Globe2], ["Supabase", selected.links.supabase, Code2], ["Operação", selected.links.operation, Boxes]] as const;
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Ecossistema AMT</p><h2 className="mt-1 text-lg font-semibold text-slate-950">Sistemas</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Central operacional para acessar infraestrutura, código, serviços e indicadores de cada produto.</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">{systems.length} sistemas</span><span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{systems.filter((system) => system.status === "Integrado").length} integrado</span><span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{systems.filter((system) => system.status !== "Integrado").length} externos</span></div></div></div>
      <div className="grid gap-4 md:grid-cols-3">{systems.map((system) => { const Icon = system.icon; const active = system.id === selected.id; return <button key={system.id} type="button" onClick={() => setSelectedId(system.id)} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${active ? "border-blue-500 ring-1 ring-blue-500/20" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100"><Icon className="h-5 w-5 text-slate-900" /></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${system.status === "Integrado" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{system.status}</span></div><h3 className="mt-4 font-semibold text-slate-950">{system.name}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{system.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{system.capabilities.map((capability) => <span key={capability} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">{capability}</span>)}</div></button>; })}</div>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-xl font-semibold text-slate-950">{selected.name}</h3><span className={`rounded-full px-3 py-1 text-xs font-medium ${isIntegrated ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{selected.status}</span></div><p className="mt-1 text-sm text-slate-500">{selected.description}</p></div><a href={selected.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Abrir sistema <ExternalLink className="h-4 w-4" /></a></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Visitas hoje","—","Analytics será conectado na próxima etapa",BarChart3],["Últimos 7 dias","—","Analytics será conectado na próxima etapa",Activity],["Leads","—","Dados do módulo Leads",Users],["GitHub issues",selected.githubRepo ? (github.loading ? "…" : String(github.issues)) : "—",github.error || "Dados públicos do repositório",GitBranch]].map(([label,value,detail,Icon]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="h-4 w-4 text-blue-700" />{label}</div><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{String(value)}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{String(detail)}</p></div>)}</div></section>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]"><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-base font-semibold text-slate-950">Acessos operacionais</h3><p className="mt-1 text-sm text-slate-500">Acesso direto aos serviços e painéis do sistema selecionado.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{quickLinks.map(([label,href,Icon]) => <a key={label} href={href || undefined} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined} aria-disabled={!href} className={`flex items-center justify-between rounded-xl border p-4 ${href ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30" : "cursor-not-allowed border-dashed border-slate-200 bg-slate-50 opacity-60"}`}><span className="flex items-center gap-3"><span className="rounded-lg bg-slate-100 p-2"><Icon className="h-4 w-4 text-blue-700" /></span><span><span className="block text-sm font-medium text-slate-950">{label}</span><span className="block text-[11px] text-slate-400">{href ? "Abrir painel" : "Ainda não configurado"}</span></span></span><ExternalLink className="h-4 w-4 text-slate-400" /></a>)}</div></section><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-base font-semibold text-slate-950">GitHub</h3><p className="mt-1 text-sm text-slate-500">Informações públicas do repositório selecionado.</p>{selected.githubRepo ? <div className="mt-5 space-y-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Repositório</p><p className="mt-1 truncate text-sm font-medium text-slate-950">{github.repo?.full_name ?? selected.githubRepo}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Issues abertas</p><p className="mt-1 text-lg font-semibold text-slate-950">{github.loading ? "…" : github.issues}</p></div><div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Pull requests</p><p className="mt-1 text-lg font-semibold text-slate-950">{github.loading ? "…" : github.prs}</p></div></div><div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Último commit</p><p className="mt-1 text-sm font-medium text-slate-950">{github.commit?.commit?.message ?? (github.loading ? "Carregando…" : "Não disponível")}</p>{github.commit?.sha && <p className="mt-1 font-mono text-[10px] text-slate-400">{github.commit.sha.slice(0, 7)} · {new Date(github.commit.commit.author.date).toLocaleString("pt-BR")}</p>}</div>{github.error && <p className="text-xs font-medium text-red-600">{github.error}</p>}<a href={selected.links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">Abrir GitHub <ExternalLink className="h-3.5 w-3.5" /></a></div> : <div className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-xs leading-5 text-slate-500">Repositório ainda não configurado para este sistema.</div>}</section></div>
      <section className="rounded-xl border border-dashed border-slate-200 bg-white p-5"><div className="flex gap-3"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><div><p className="text-sm font-medium text-slate-950">Fase 2 — GitHub conectado</p><p className="mt-1 text-xs leading-5 text-slate-500">O Control Center já consulta dados públicos do repositório configurado. Analytics, Cloudflare e dados operacionais específicos entram nas próximas integrações.</p></div></div></section>
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
