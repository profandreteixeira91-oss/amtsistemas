import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  GitBranch,
  Glasses,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Search,
  Swords,
  Users,
  Wrench,
  Check,
  Copy,
  RefreshCw,
  Sparkles as SparklesIcon,
} from "lucide-react";

import { DevelopmentWorkspace } from "@/components/admin/DevelopmentWorkspace";
import { PromptGeneratorWorkspace } from "@/components/admin/PromptGeneratorWorkspace";
import { DevelopmentAgentWorkspace } from "@/components/admin/DevelopmentAgentWorkspace";
import { SupportWhatsAppWorkspace } from "@/components/admin/SupportWhatsAppWorkspace";
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

type IconType = React.ComponentType<{ className?: string }>;

type AmtSystem = {
  id: string;
  /** slug em manager_sistemas: catálogo, planos e leads do site */
  catalogSlug: string;
  name: string;
  platform: string;
  description: string;
  href: string;
  icon: IconType;
  githubRepo: string;
  /** repositório público com os instaladores (só sistemas desktop) */
  releasesRepo?: string;
  /** Edge Function platform-overview do sistema: clientes, assinaturas, cobranças e uso (só leitura) */
  overviewUrl: string;
  capabilities: string[];
  links: Array<{ label: string; hint: string; href: string; icon: IconType }>;
};

const OPTIONE_TRIAL_ORIGIN = "teste-gratis-amt-optione";

const systems: AmtSystem[] = [
  {
    id: "optione",
    catalogSlug: "amt-optione",
    name: "AMT OptiOne",
    platform: "Desktop · SaaS",
    description: "Gestão para óticas: aplicativo desktop multi-loja, vendido com teste grátis de 14 dias pelo site.",
    href: "https://amtsistemas.com.br/optione",
    icon: Glasses,
    githubRepo: "profandreteixeira91-oss/gestao_otica",
    releasesRepo: "profandreteixeira91-oss/amt-optione-releases",
    overviewUrl: "https://rragitmijwruydspafac.supabase.co/functions/v1/platform-overview",
    capabilities: ["Landing e teste grátis", "Chave de acesso", "Instalador Windows", "Supabase", "Mercado Pago"],
    links: [
      { label: "Landing page", hint: "amtsistemas.com.br/optione", href: "https://amtsistemas.com.br/optione", icon: Globe2 },
      { label: "Teste grátis", hint: "Cadastro da ótica pelo site", href: "https://amtsistemas.com.br/optione/teste-gratis", icon: Plus },
      { label: "Nova chave de acesso", hint: "O dono gera com login e senha", href: "https://amtsistemas.com.br/optione/nova-chave", icon: KeyRound },
      { label: "Versões do instalador", hint: "Releases no GitHub", href: "https://github.com/profandreteixeira91-oss/amt-optione-releases/releases", icon: Download },
      { label: "Código-fonte", hint: "GitHub · gestao_otica", href: "https://github.com/profandreteixeira91-oss/gestao_otica", icon: GitBranch },
      { label: "Supabase", hint: "Projeto rragitmijwruydspafac", href: "https://supabase.com/dashboard/project/rragitmijwruydspafac", icon: Database },
    ],
  },
  {
    id: "dojo-manager",
    catalogSlug: "amt-dojo-manager",
    name: "AMT Dojo Manager",
    platform: "Web · SaaS",
    description: "Gestão para academias de artes marciais, dojos e estúdios de treino, com app do aluno.",
    href: "https://amtdojomanager.com.br/dojo",
    icon: Swords,
    githubRepo: "profandreteixeira91-oss/amtdojomanager",
    overviewUrl: "https://gudjmkiyprgwgxmzbgji.supabase.co/functions/v1/platform-overview",
    capabilities: ["Painel da academia", "App do aluno (PWA)", "Portal da equipe", "Supabase", "Cloudflare Workers"],
    links: [
      { label: "Site", hint: "amtdojomanager.com.br", href: "https://amtdojomanager.com.br/dojo", icon: Globe2 },
      { label: "Painel da academia", hint: "/dojo/app", href: "https://amtdojomanager.com.br/dojo/app", icon: LayoutDashboard },
      { label: "App do aluno", hint: "/app", href: "https://amtdojomanager.com.br/app", icon: Users },
      { label: "Ambiente de teste", hint: "teste.amtsistemas.com.br · branch 1nov26", href: "https://teste.amtsistemas.com.br/dojo", icon: FlaskConical },
      { label: "Código-fonte", hint: "GitHub · amtdojomanager", href: "https://github.com/profandreteixeira91-oss/amtdojomanager", icon: GitBranch },
      { label: "Supabase", hint: "Projeto gudjmkiyprgwgxmzbgji", href: "https://supabase.com/dashboard/project/gudjmkiyprgwgxmzbgji", icon: Database },
      { label: "Cloudflare", hint: "Workers e domínios", href: "https://dash.cloudflare.com/", icon: Cloud },
    ],
  },
];

type CatalogSystem = { id: string; slug: string; nome: string; versao: string | null; trial_dias: number | null; ativo: boolean };
type CatalogPlan = { id: string; sistema_id: string; slug: string; nome: string; preco_mensal: number | null; preco_anual: number | null; ativo: boolean; destaque: boolean };
type CommercialLead = { id: string; nome: string; empresa: string | null; email: string | null; telefone: string | null; origem: string | null; status: string; observacoes: string | null; sistema_interesse_id: string | null; created_at: string };

const commercialLeadStatuses = [
  ["novo", "Novo"], ["contatado", "Contatado"], ["qualificado", "Qualificado"], ["proposta", "Proposta"],
  ["negociacao", "Negociação"], ["ganho", "Ganho"], ["perdido", "Perdido"],
] as const;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const daysAgo = (days: number) => Date.now() - days * 86400000;

// Catálogo (manager_sistemas/manager_planos) e leads comerciais (manager_leads) dos sistemas do Control Center.
function useCommercialData() {
  const [catalog, setCatalog] = useState<CatalogSystem[]>([]);
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [leadsError, setLeadsError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [catalogResult, plansResult, leadsResult] = await Promise.all([
      amtSupabase.from("manager_sistemas").select("id,slug,nome,versao,trial_dias,ativo").in("slug", systems.map((system) => system.catalogSlug)),
      amtSupabase.from("manager_planos").select("id,sistema_id,slug,nome,preco_mensal,preco_anual,ativo,destaque").order("ordem").order("preco_mensal"),
      amtSupabase.from("manager_leads").select("id,nome,empresa,email,telefone,origem,status,observacoes,sistema_interesse_id,created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    const catalogRows = (catalogResult.data ?? []) as CatalogSystem[];
    const ids = new Set(catalogRows.map((item) => item.id));
    setCatalog(catalogRows);
    setPlans(((plansResult.data ?? []) as CatalogPlan[]).filter((plan) => ids.has(plan.sistema_id)));
    setLeads(((leadsResult.data ?? []) as CommercialLead[]).filter((lead) => (lead.sistema_interesse_id && ids.has(lead.sistema_interesse_id)) || lead.origem === OPTIONE_TRIAL_ORIGIN));
    setLeadsError(leadsResult.error ? "Leads comerciais indisponíveis: o acesso do Control Center a manager_leads ainda não foi liberado no banco." : "");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  return { catalog, plans, leads, setLeads, leadsError, loading, reload: load };
}

function isOptioneTrial(lead: CommercialLead) {
  return lead.origem === OPTIONE_TRIAL_ORIGIN;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const modules = [
  { label: "Sistemas", icon: Boxes, to: "/admin/sistemas" },
  { label: "WhatsApp", icon: MessageCircle, to: "/admin/whatsapp" },
  { label: "Leads", icon: Users, to: "/admin/leads" },
  { label: "Formulários", icon: FileText, to: "/admin/formularios" },
  { label: "Ferramentas", icon: Wrench, to: "/admin/ferramentas" },
  { label: "Auditoria", icon: Activity, to: "/admin/auditoria" },
  { label: "Desenvolvimento", icon: Code2, to: "/admin/desenvolvimento" },
];

type AuditLog = { id: string; actor_user_id: string | null; action: string; resource_type: string | null; resource_id: string | null; metadata: Record<string, unknown>; created_at: string };
type FormSubmission = { id: string; form_name: string; name: string; email: string | null; phone: string | null; source: string | null; status: string; notes: string | null; payload: Record<string, unknown>; created_at: string };

function DashboardOverview({ onOpen }: { onOpen: (module: string) => void }) {
  const commercial = useCommercialData();
  const [counts, setCounts] = useState<{ leads: number | null; forms: number | null; newForms: number | null }>({ leads: null, forms: null, newForms: null });
  const [activity, setActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    void Promise.all([
      amtSupabase.from("leads").select("id", { count: "exact", head: true }),
      amtSupabase.from("form_submissions").select("id", { count: "exact", head: true }),
      amtSupabase.from("form_submissions").select("id", { count: "exact", head: true }).eq("status", "novo"),
      amtSupabase.from("audit_logs").select("id,actor_user_id,action,resource_type,resource_id,metadata,created_at").order("created_at", { ascending: false }).limit(6),
    ]).then(([leads, forms, newForms, logs]) => {
      setCounts({ leads: leads.count ?? null, forms: forms.count ?? null, newForms: newForms.count ?? null });
      setActivity((logs.data ?? []) as AuditLog[]);
    });
  }, []);

  const trials = commercial.leads.filter(isOptioneTrial);
  const trials30 = trials.filter((lead) => new Date(lead.created_at).getTime() >= daysAgo(30)).length;
  const show = (value: number | null) => (value === null ? "—" : pad(value));
  const kpis = [
    { label: "Sistemas", value: pad(systems.length), detail: systems.map((system) => system.name.replace("AMT ", "")).join(" · "), icon: Boxes, module: "Sistemas" },
    { label: "Testes grátis OptiOne", value: commercial.leadsError ? "—" : pad(trials30), detail: commercial.leadsError ? "Acesso aos leads comerciais pendente" : `Últimos 30 dias · ${trials.length} no total`, icon: Glasses, module: "Sistemas" },
    { label: "Leads", value: show(counts.leads), detail: "Módulo Leads do Control Center", icon: Users, module: "Leads" },
    { label: "Formulários novos", value: show(counts.newForms), detail: counts.forms === null ? "Formulários recebidos" : `${counts.forms} no total`, icon: FileText, module: "Formulários" },
  ];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} type="button" onClick={() => onOpen(item.module)} className="text-left">
              <Card className="h-full border-slate-200 bg-white text-slate-950 shadow-sm transition-colors hover:border-blue-300">
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
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-slate-200 bg-white text-slate-950 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sistemas</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Produtos da AMT em operação.</p>
            </div>
            <button type="button" onClick={() => onOpen("Sistemas")} className="shrink-0 whitespace-nowrap text-sm font-medium text-blue-700 hover:text-blue-800">Ver todos</button>
          </CardHeader>
          <CardContent className="space-y-3">
            {systems.map((system) => {
              const Icon = system.icon;
              const catalogItem = commercial.catalog.find((item) => item.slug === system.catalogSlug);
              const activePlans = commercial.plans.filter((plan) => plan.sistema_id === catalogItem?.id && plan.ativo).length;
              return (
                <div key={system.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                  <div className="rounded-lg bg-slate-100 p-2.5"><Icon className="h-5 w-5 text-slate-700" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{system.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{system.platform}</span>
                      {catalogItem && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{activePlans} {activePlans === 1 ? "plano" : "planos"} no catálogo</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{system.description}</p>
                    <SystemSubscriptionSummary system={system} />
                  </div>
                  <a href={system.href} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700" aria-label={"Abrir " + system.name}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-950 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Acessos rápidos</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Ferramentas centrais da operação.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="https://github.com/profandreteixeira91-oss" icon={GitBranch} label="GitHub" />
            <QuickLink href="https://supabase.com/dashboard/project/yqxmxevphdumyuwlvppg" icon={Database} label="Supabase · AMT Sistemas" />
            <QuickLink href="https://supabase.com/dashboard/project/rragitmijwruydspafac" icon={Glasses} label="Supabase · AMT OptiOne" />
            <QuickLink href="https://supabase.com/dashboard/project/gudjmkiyprgwgxmzbgji" icon={Swords} label="Supabase · Dojo Manager" />
            <QuickLink href="https://dash.cloudflare.com/" icon={Cloud} label="Cloudflare" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white text-slate-950 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Últimos testes grátis</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Óticas cadastradas no AMT OptiOne pelo site.</p>
            </div>
            <button type="button" onClick={() => onOpen("Sistemas")} className="shrink-0 whitespace-nowrap text-sm font-medium text-blue-700 hover:text-blue-800">Ver todos</button>
          </CardHeader>
          <CardContent className="space-y-4">
            {commercial.leadsError ? <p className="text-sm text-slate-500">{commercial.leadsError}</p> : commercial.loading ? <p className="text-sm text-slate-500">Carregando...</p> : trials.length === 0 ? <p className="text-sm text-slate-500">Nenhum teste grátis registrado ainda.</p> : trials.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lead.empresa || lead.nome}</p>
                  <p className="truncate text-xs text-slate-500">{lead.nome} · {lead.email || lead.telefone || "sem contato"}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-950 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Atividade recente</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Últimas ações registradas na auditoria.</p>
            </div>
            <button type="button" onClick={() => onOpen("Auditoria")} className="shrink-0 whitespace-nowrap text-sm font-medium text-blue-700 hover:text-blue-800">Ver auditoria</button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.length === 0 ? <p className="text-sm text-slate-500">Nenhuma ação registrada ainda.</p> : activity.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{log.action.replace(/[._]/g, " ")}</p>
                  <p className="truncate text-xs text-slate-500">{log.resource_type || "—"}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{new Date(log.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

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
    return <div className="amt-admin flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">Validando sessão...</div>;
  }

  return (
    <main className="amt-admin min-h-screen bg-white text-slate-950">
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

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
            {["Dashboard", ...modules.map((item) => item.label)].map((label) => <button key={label} type="button" onClick={() => setActiveModule(label)} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${activeModule === label ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>)}
          </nav>

          <div className="space-y-8 p-5 sm:p-8">
            {activeModule !== "Dashboard" && <ModuleWorkspace module={activeModule} />}
            {activeModule === "Dashboard" && <DashboardOverview onOpen={setActiveModule} />}
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
  if (module === "WhatsApp") return <SupportWhatsAppWorkspace />;
  if (module === "Leads") return <LeadsWorkspace />;
  if (module === "Sistemas") return <SystemsWorkspace />;
  if (module === "Formulários") return <FormsWorkspace />;
  if (module === "Ferramentas") return <ToolsWorkspace />;
  if (module === "Auditoria") return <AuditWorkspace />;
  if (module === "Desenvolvimento") return <DevelopmentModuleWorkspace />;
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
        <Button onClick={() => setShowNew((v) => !v)} className="gap-2 bg-blue-700 text-white hover:bg-blue-800"><Plus className="h-4 w-4" /> Nova solicitação</Button>
      </div>
      {message && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Total",counts.total],["Novas",counts.novo],["Em atendimento",counts.atendimento],["Concluídas",counts.concluido]].map(([label,value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{String(value)}</p></div>)}
      </div>
      {showNew && <form onSubmit={createSubmission} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div><h3 className="font-semibold">Cadastrar solicitação</h3><p className="mt-1 text-xs text-slate-500">Útil para registros manuais até os formulários públicos estarem integrados.</p></div><div />
        {([["form_name","Formulário *"],["name","Nome *"],["email","E-mail"],["phone","Telefone"],["source","Origem"]] as const).map(([key,label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input required={key==="form_name"||key==="name"} value={newItem[key]} onChange={(e) => setNewItem((v) => ({...v,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>)}
        <label className="sm:col-span-2 text-sm font-medium text-slate-700">Observações<textarea value={newItem.notes} onChange={(e) => setNewItem((v) => ({...v,notes:e.target.value}))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950" /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving} className="bg-black text-white hover:bg-slate-900">{saving ? "Salvando..." : "Cadastrar"}</Button></div>
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
        <Button onClick={() => { setSelectedLead(null); setForm(emptyForm); setShowForm(true); }} className="gap-2 bg-blue-700 text-white hover:bg-blue-800"><Plus className="h-4 w-4" /> Novo lead</Button>
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
        <div className="sm:col-span-2 flex gap-2"><Button type="submit" disabled={saving} className="bg-black text-white hover:bg-slate-900">{saving ? "Salvando..." : selectedLead ? "Salvar alterações" : "Cadastrar lead"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button></div>
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
            <Button type="button" size="sm" onClick={() => formatJson(false)} className="bg-black text-white hover:bg-slate-900">Formatar</Button>
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
            <Button type="button" size="sm" onClick={() => setUuid(crypto.randomUUID())} className="bg-black text-white hover:bg-slate-900">Novo UUID</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyValue(uuid, "uuid")} className="gap-1.5"><Copy className="h-3.5 w-3.5" />{copied === "uuid" ? "Copiado" : "Copiar"}</Button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ToolHeader icon={ExternalLink} title="Codificador de URL" description="Converta parâmetros e valores para uso seguro em URLs ou decodifique valores já existentes." />
          <textarea value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="texto ou parâmetro de URL" className="mt-5 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={urlMode} onChange={(e) => setUrlMode(e.target.value as "encode" | "decode")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"><option value="encode">Codificar</option><option value="decode">Decodificar</option></select>
            <Button type="button" size="sm" onClick={transformUrl} className="bg-black text-white hover:bg-slate-900">Processar</Button>
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

type OverviewCustomer = {
  id: string; name: string; code: string | null; owner_name: string | null; owner_email: string | null; phone: string | null; city?: string | null;
  plan: string | null; plan_name: string | null; status: string | null; group: string; amount_monthly: number | null;
  trial_ends_at: string | null; current_period_end: string | null; next_due_date?: string | null; last_payment_status?: string | null;
  cancel_at_period_end?: boolean; payment_method?: string | null; last_payment_error?: string | null; created_at: string | null;
  users?: number; devices?: number; last_seen_at?: string | null;
  students?: number; active_students?: number; apk_downloads?: number; open_tickets?: number;
};
type PlatformOverview = {
  system: string;
  generated_at: string;
  customers: OverviewCustomer[];
  payments?: Array<{ id: string; customer_id: string; customer_name: string | null; amount: number | null; status: string; date: string }>;
  devices?: { active: number; seen_last_7d: number; activated_last_30d: number };
  apk?: { published_versions: number; academies_with_apk: number; downloads: number; downloads_last_30d: number };
  support?: Array<{ id: string; customer_id: string; customer_name: string | null; subject: string; category: string | null; status: string; priority: string | null; unread: boolean; last_message_at: string }>;
  open_tickets?: number;
  amt_fees?: { last_30d: number; transactions_last_30d: number };
};

const customerGroups: Record<string, { label: string; className: string }> = {
  pagante: { label: "Pagante", className: "bg-emerald-50 text-emerald-700" },
  liberado: { label: "Liberado", className: "bg-sky-50 text-sky-700" },
  teste: { label: "Em teste", className: "bg-blue-50 text-blue-700" },
  teste_vencido: { label: "Teste vencido", className: "bg-amber-50 text-amber-700" },
  pendente: { label: "Pendente", className: "bg-red-50 text-red-700" },
  cancelado: { label: "Cancelado", className: "bg-slate-100 text-slate-500" },
  sem_assinatura: { label: "Sem assinatura", className: "bg-slate-100 text-slate-500" },
};

// Relatório da plataforma de cada sistema (Edge Function platform-overview no projeto do sistema).
// A função confere o token do Control Center no projeto amt-sistemas; nada privilegiado passa pelo navegador.
function usePlatformOverview(url: string) {
  const [state, setState] = useState<{ loading: boolean; error: string; data: PlatformOverview | null }>({ loading: true, error: "", data: null });

  async function load() {
    setState((value) => ({ ...value, loading: true, error: "" }));
    try {
      const { data } = await amtSupabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Entre novamente.");
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({})) as PlatformOverview & { error?: string };
      if (!response.ok) throw new Error(body.error ?? (response.status === 404 ? "O relatório ainda não foi publicado neste sistema." : "Não foi possível carregar o relatório."));
      setState({ loading: false, error: "", data: body });
    } catch (error) {
      const message = error instanceof TypeError ? "Relatório indisponível: a função platform-overview não respondeu (ainda não publicada?)." : error instanceof Error ? error.message : "Não foi possível carregar o relatório.";
      setState({ loading: false, error: message, data: null });
    }
  }

  useEffect(() => { void load(); }, [url]);

  return { ...state, reload: load };
}

function summarizeCustomers(customers: OverviewCustomer[]) {
  const byGroup = (group: string) => customers.filter((customer) => customer.group === group).length;
  return {
    total: customers.length,
    paying: byGroup("pagante"),
    trial: byGroup("teste"),
    expiredTrial: byGroup("teste_vencido"),
    pending: byGroup("pendente"),
    mrr: customers.filter((customer) => customer.group === "pagante").reduce((sum, customer) => sum + (customer.amount_monthly ?? 0), 0),
  };
}

const formatDate = (value: string | null | undefined) => (value ? new Date(value.length === 10 ? value + "T12:00:00" : value).toLocaleDateString("pt-BR") : "—");

function customerDeadline(customer: OverviewCustomer) {
  if (customer.group === "teste" || customer.group === "teste_vencido") return customer.trial_ends_at ? `Teste até ${formatDate(customer.trial_ends_at)}` : "Teste sem data";
  if (customer.next_due_date) return `Próxima cobrança ${formatDate(customer.next_due_date)}`;
  if (customer.current_period_end) return new Date(customer.current_period_end).getFullYear() >= 2100 ? "Sem vencimento" : `Válida até ${formatDate(customer.current_period_end)}`;
  return "—";
}

function customerUsage(customer: OverviewCustomer) {
  if (customer.devices !== undefined) {
    const lastSeen = customer.last_seen_at ? ` · visto em ${formatDate(customer.last_seen_at)}` : "";
    return `${customer.devices} ${customer.devices === 1 ? "computador" : "computadores"} · ${customer.users ?? 0} usuários${lastSeen}`;
  }
  const tickets = customer.open_tickets ? ` · ${customer.open_tickets} chamado${customer.open_tickets === 1 ? "" : "s"}` : "";
  return `${customer.active_students ?? 0} alunos ativos · ${customer.apk_downloads ?? 0} downloads do app${tickets}`;
}

function SystemSubscriptionSummary({ system }: { system: AmtSystem }) {
  const overview = usePlatformOverview(system.overviewUrl);
  if (overview.loading) return <p className="mt-2 text-xs text-slate-400">Carregando assinaturas…</p>;
  if (!overview.data) return <p className="mt-2 text-xs text-slate-400">Assinaturas indisponíveis</p>;
  const summary = summarizeCustomers(overview.data.customers);
  return <p className="mt-2 text-xs text-slate-500">{summary.total} clientes · {summary.paying} pagantes · {summary.trial} em teste · {brl.format(summary.mrr)}/mês</p>;
}

type DeletionPreview = { owner_id: string; name: string | null; email: string | null; subscription_status?: string | null; rows: number; tables: Record<string, number>; logins: number; files: number };
type DeletionSummary = { name: string | null; email: string | null; rows: number; logins_deleted: number; logins_kept: number; files_deleted: number; files_failed: number };

// Ações do relatório da plataforma (POST na mesma Edge Function), com o token do Control Center.
async function platformAction<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await amtSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir a operação.");
  return result;
}

function DeleteDojoAccountModal({ system, customer, onClose, onDeleted }: { system: AmtSystem; customer: OverviewCustomer; onClose: () => void; onDeleted: () => void }) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [summary, setSummary] = useState<DeletionSummary | null>(null);

  useEffect(() => {
    let active = true;
    platformAction<DeletionPreview>(system.overviewUrl, { action: "delete_preview", owner_id: customer.id })
      .then((data) => { if (active) setPreview(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar a prévia."); });
    return () => { active = false; };
  }, [system.overviewUrl, customer.id]);

  const accepted = [preview?.name, preview?.email].filter(Boolean).map((value) => String(value).trim().toLowerCase());
  const canDelete = Boolean(preview) && accepted.includes(confirm.trim().toLowerCase()) && !deleting;
  const topTables = preview ? Object.entries(preview.tables).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];

  async function remove() {
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    try {
      const result = await platformAction<DeletionSummary>(system.overviewUrl, { action: "delete_account", owner_id: customer.id, confirm });
      setSummary(result);
      const session = await amtSupabase.auth.getSession();
      if (session.data.session) await amtSupabase.from("audit_logs").insert({ actor_user_id: session.data.session.user.id, action: "dojo_account.deleted", resource_type: "dojo_account", resource_id: customer.id, metadata: { sistema: system.catalogSlug, name: result.name, email: result.email, rows: result.rows, logins_deleted: result.logins_deleted, logins_kept: result.logins_kept, files_deleted: result.files_deleted, files_failed: result.files_failed } });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir a conta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onKeyDown={(e) => { if (e.key === "Escape" && !deleting) onClose(); }}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-slate-950 shadow-xl">
        <h3 id="delete-account-title" className="text-lg font-semibold">{summary ? "Conta excluída" : "Excluir conta da academia"}</h3>
        <p className="mt-1 text-sm text-slate-500">{customer.name}{customer.owner_email ? ` · ${customer.owner_email}` : ""}</p>

        {summary ? (
          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <p>{summary.rows} registros removidos do {system.name}.</p>
            <p>{summary.logins_deleted} {summary.logins_deleted === 1 ? "login excluído" : "logins excluídos"}{summary.logins_kept ? ` · ${summary.logins_kept} mantido${summary.logins_kept === 1 ? "" : "s"} por estar em uso em outro lugar (outra academia ou loja Fight Wear)` : ""}.</p>
            <p>{summary.files_deleted} arquivos removidos{summary.files_failed ? ` · ${summary.files_failed} não puderam ser removidos do Storage` : ""}.</p>
            <div className="pt-3"><Button type="button" onClick={onClose} className="bg-black text-white hover:bg-slate-900">Fechar</Button></div>
          </div>
        ) : (
          <>
            {!preview && !error && <p className="mt-5 text-sm text-slate-500">Calculando o que será removido…</p>}
            {preview && (
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                  <p className="font-medium">Esta ação é definitiva e não pode ser desfeita.</p>
                  <p className="mt-1 text-xs leading-5">Apaga todos os dados da academia (alunos, turmas, presenças, financeiro, contratos, certificados e demais registros), os arquivos enviados e os logins que não estiverem em uso em outro lugar.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[["Registros", preview.rows], ["Logins", preview.logins], ["Arquivos", preview.files]].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{String(value)}</p></div>)}
                </div>
                {topTables.length > 0 && <p className="text-xs leading-5 text-slate-500">Maiores volumes: {topTables.map(([table, count]) => `${table.replace(/^(dojo|academy)_/, "").replaceAll("_", " ")} (${count})`).join(", ")}.</p>}
                <label className="block text-sm font-medium text-slate-700">
                  Para confirmar, digite o nome ou o e-mail da academia
                  <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={preview.name ?? preview.email ?? ""} autoFocus className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-red-400" />
                </label>
              </div>
            )}
            {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>Cancelar</Button>
              <Button type="button" onClick={() => void remove()} disabled={!canDelete} className="bg-red-600 text-white hover:bg-red-700">{deleting ? "Excluindo…" : "Excluir definitivamente"}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlatformSection({ system }: { system: AmtSystem }) {
  const overview = usePlatformOverview(system.overviewUrl);
  const [group, setGroup] = useState("todos");
  const [search, setSearch] = useState("");
  const isDesktop = Boolean(system.releasesRepo);
  const noun = isDesktop ? "Óticas" : "Academias";
  // Exclusão de contas inativas: por enquanto só o Dojo Manager oferece a ação.
  const canDeleteAccounts = system.id === "dojo-manager";
  const [deleting, setDeleting] = useState<OverviewCustomer | null>(null);

  const customers = overview.data?.customers ?? [];
  const summary = summarizeCustomers(customers);
  const filtered = customers.filter((customer) => (group === "todos" || customer.group === group) && [customer.name, customer.code ?? "", customer.owner_name ?? "", customer.owner_email ?? "", customer.phone ?? "", customer.city ?? ""].join(" ").toLowerCase().includes(search.toLowerCase()));
  const groupsPresent = Object.keys(customerGroups).filter((key) => customers.some((customer) => customer.group === key));

  const cards: Array<[string, string, string]> = [
    [noun, String(summary.total), `${summary.pending} com pagamento pendente`],
    ["Pagantes", String(summary.paying), "Assinatura ativa com cobrança"],
    ["Em teste", String(summary.trial), `${summary.expiredTrial} com teste vencido`],
    ["Receita mensal", brl.format(summary.mrr), "Soma das assinaturas pagantes"],
  ];

  return (
    <section className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Clientes e assinaturas</h3>
            <p className="mt-1 text-sm text-slate-500">{noun} cadastradas no {system.name}, direto do banco do sistema.{overview.data ? ` Atualizado às ${new Date(overview.data.generated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : ""}</p>
          </div>
          <div className="flex gap-2">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar" className="w-48 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>
            <Button type="button" variant="outline" size="sm" onClick={() => void overview.reload()} className="h-9 gap-2"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          </div>
        </div>

        {overview.loading && !overview.data ? <p className="mt-5 text-sm text-slate-500">Carregando…</p> : overview.error ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{overview.error}</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(([label, value, detail]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["todos", ...groupsPresent].map((key) => {
                const total = key === "todos" ? customers.length : customers.filter((customer) => customer.group === key).length;
                return <button key={key} type="button" onClick={() => setGroup(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${group === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{key === "todos" ? "Todos" : customerGroups[key].label} · {total}</button>;
              })}
            </div>

            {filtered.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{customers.length ? "Nenhum cliente encontrado para o filtro." : "Nenhum cliente cadastrado ainda."}</p> : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4 font-medium">Cliente</th><th className="py-2 pr-4 font-medium">Situação</th><th className="py-2 pr-4 font-medium">Plano</th><th className="py-2 pr-4 font-medium">Prazo</th><th className="py-2 font-medium">Uso</th>{canDeleteAccounts && <th className="py-2 pl-4 font-medium"><span className="sr-only">Ações</span></th>}</tr></thead>
                  <tbody>
                    {filtered.map((customer) => {
                      const info = customerGroups[customer.group] ?? customerGroups.sem_assinatura;
                      return (
                        <tr key={customer.id} className="border-b border-slate-100 align-top last:border-0">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-950">{customer.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{[customer.code, customer.owner_name, customer.owner_email, customer.phone, customer.city].filter(Boolean).join(" · ") || "Sem contato"}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${info.className}`}>{info.label}</span>
                            {customer.cancel_at_period_end && <p className="mt-2 text-[11px] text-amber-700">Cancela no fim do período</p>}
                            {customer.last_payment_error && <p className="mt-2 max-w-48 text-[11px] text-red-600">{customer.last_payment_error}</p>}
                          </td>
                          <td className="py-3 pr-4 text-slate-700">
                            <p>{customer.plan_name ?? "—"}</p>
                            <p className="mt-1 text-xs text-slate-500">{customer.amount_monthly !== null ? `${brl.format(customer.amount_monthly)}/mês` : ""}{customer.payment_method ? ` · ${customer.payment_method}` : ""}</p>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-600">{customerDeadline(customer)}{customer.created_at && <p className="mt-1 text-slate-400">Cliente desde {formatDate(customer.created_at)}</p>}</td>
                          <td className="py-3 text-xs text-slate-600">{customerUsage(customer)}</td>
                          {canDeleteAccounts && (
                            <td className="py-3 pl-4 text-right">
                              <button type="button" onClick={() => setDeleting(customer)} disabled={customer.group === "pagante"} title={customer.group === "pagante" ? "Academia pagante: cancele a assinatura antes de excluir" : "Excluir conta"} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">Excluir</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {deleting && <DeleteDojoAccountModal system={system} customer={deleting} onClose={() => setDeleting(null)} onDeleted={() => void overview.reload()} />}

      {overview.data && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {overview.data.payments !== undefined && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">Cobranças recentes</h3>
              <p className="mt-1 text-sm text-slate-500">Mensalidades cobradas pelo Mercado Pago.</p>
              {overview.data.payments.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Nenhuma cobrança registrada ainda.</p> : (
                <div className="mt-5 divide-y divide-slate-100">
                  {overview.data.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0"><p className="truncate font-medium text-slate-950">{payment.customer_name ?? "Ótica removida"}</p><p className="text-xs text-slate-500">{formatDate(payment.date)} · {payment.status}</p></div>
                      <span className="shrink-0 font-medium text-slate-950">{payment.amount !== null ? brl.format(payment.amount) : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {overview.data.support !== undefined && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">Chamados de suporte abertos</h3>
              <p className="mt-1 text-sm text-slate-500">Respondidos no painel do Dojo Manager.</p>
              {overview.data.support.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Nenhum chamado aberto.</p> : (
                <div className="mt-5 divide-y divide-slate-100">
                  {overview.data.support.map((ticket) => (
                    <div key={ticket.id} className="py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-950">{ticket.subject}</p>{ticket.unread && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">Não lido</span>}</div>
                      <p className="mt-1 text-xs text-slate-500">{ticket.customer_name ?? "Academia"} · {ticket.status.replace("_", " ")}{ticket.priority ? ` · prioridade ${ticket.priority}` : ""} · {formatDate(ticket.last_message_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-950">{overview.data.devices ? "Instalações" : "App do aluno"}</h3>
            <p className="mt-1 text-sm text-slate-500">{overview.data.devices ? "Computadores ativados com a chave de acesso." : "APK publicado pelas academias para os alunos."}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(overview.data.devices
                ? [["Computadores ativos", overview.data.devices.active], ["Vistos em 7 dias", overview.data.devices.seen_last_7d], ["Ativados em 30 dias", overview.data.devices.activated_last_30d]]
                : overview.data.apk
                  ? [["Downloads do APK", overview.data.apk.downloads], ["Downloads em 30 dias", overview.data.apk.downloads_last_30d], ["Academias com APK", overview.data.apk.academies_with_apk], ["Versões publicadas", overview.data.apk.published_versions]]
                  : []
              ).map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950">{String(value)}</p></div>)}
            </div>
            {overview.data.amt_fees && <p className="mt-4 text-xs text-slate-500">Taxa da AMT sobre cobranças das academias (30 dias): {brl.format(overview.data.amt_fees.last_30d)} em {overview.data.amt_fees.transactions_last_30d} transações.</p>}
          </section>
        </div>
      )}
    </section>
  );
}

type GitHubState = { loading: boolean; private: boolean; error: string; commit: { sha: string; message: string; date: string } | null; issues: number; prs: number };
type ReleaseState = { loading: boolean; error: string; tag: string; publishedAt: string; url: string; downloads: number } | null;

function SystemsWorkspace() {
  const [selectedId, setSelectedId] = useState(systems[0].id);
  const selected = systems.find((system) => system.id === selectedId) ?? systems[0];
  const commercial = useCommercialData();
  const [github, setGithub] = useState<GitHubState>({ loading: false, private: false, error: "", commit: null, issues: 0, prs: 0 });
  const [release, setRelease] = useState<ReleaseState>(null);
  const [production, setProduction] = useState<{ status: "verificando" | "no ar" | "sem resposta"; ms: number | null }>({ status: "verificando", ms: null });
  const [leadSearch, setLeadSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const base = "https://api.github.com/repos/" + selected.githubRepo;
    setGithub({ loading: true, private: false, error: "", commit: null, issues: 0, prs: 0 });
    (async (): Promise<GitHubState> => {
      const repoResponse = await fetch(base);
      // Repositório privado: a API pública responde 404 sem token.
      if (repoResponse.status === 404) return { loading: false, private: true, error: "", commit: null, issues: 0, prs: 0 };
      if (!repoResponse.ok) throw new Error("Não foi possível consultar o repositório.");
      const [commits, issues] = await Promise.all([
        fetch(base + "/commits?per_page=1").then((r) => r.ok ? r.json() : []),
        fetch(base + "/issues?state=open&per_page=100").then((r) => r.ok ? r.json() : []),
      ]) as [Array<{ sha: string; commit: { message: string; author?: { date?: string } } }>, Array<{ pull_request?: unknown }>];
      const last = commits[0];
      return {
        loading: false, private: false, error: "",
        commit: last ? { sha: last.sha, message: last.commit.message.split("\n")[0], date: last.commit.author?.date ?? "" } : null,
        issues: issues.filter((item) => !item.pull_request).length,
        prs: issues.filter((item) => Boolean(item.pull_request)).length,
      };
    })()
      .then((state) => { if (active) setGithub(state); })
      .catch((error) => { if (active) setGithub({ loading: false, private: false, error: error instanceof Error ? error.message : "Falha ao consultar o GitHub.", commit: null, issues: 0, prs: 0 }); });

    if (selected.releasesRepo) {
      setRelease({ loading: true, error: "", tag: "", publishedAt: "", url: "", downloads: 0 });
      fetch("https://api.github.com/repos/" + selected.releasesRepo + "/releases/latest")
        .then((r) => r.ok ? r.json() : Promise.reject(new Error("Nenhuma versão publicada encontrada.")))
        .then((data: { tag_name: string; published_at: string; html_url: string; assets?: Array<{ name: string; download_count?: number }> }) => {
          // Só os instaladores: o .sha256 é baixado também pela atualização automática para conferir o arquivo.
          const downloads = (data.assets ?? []).filter((asset) => asset.name.toLowerCase().endsWith(".exe")).reduce((sum, asset) => sum + (asset.download_count ?? 0), 0);
          if (active) setRelease({ loading: false, error: "", tag: data.tag_name, publishedAt: data.published_at, url: data.html_url, downloads });
        })
        .catch((error) => { if (active) setRelease({ loading: false, error: error instanceof Error ? error.message : "Falha ao consultar as versões.", tag: "", publishedAt: "", url: "", downloads: 0 }); });
    } else {
      setRelease(null);
    }

    // Sem CORS a resposta é opaca: só dá para saber se o endereço respondeu.
    setProduction({ status: "verificando", ms: null });
    const started = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    fetch(selected.href, { mode: "no-cors", cache: "no-store", signal: controller.signal })
      .then(() => { if (active) setProduction({ status: "no ar", ms: Math.round(performance.now() - started) }); })
      .catch(() => { if (active) setProduction({ status: "sem resposta", ms: null }); })
      .finally(() => window.clearTimeout(timeout));

    return () => { active = false; controller.abort(); };
  }, [selected]);

  const catalogItem = commercial.catalog.find((item) => item.slug === selected.catalogSlug);
  const systemPlans = commercial.plans.filter((plan) => plan.sistema_id === catalogItem?.id);
  const activePlans = systemPlans.filter((plan) => plan.ativo);
  const cheapest = activePlans.reduce<number | null>((min, plan) => plan.preco_mensal !== null && (min === null || Number(plan.preco_mensal) < min) ? Number(plan.preco_mensal) : min, null);
  const systemLeads = commercial.leads.filter((lead) => (catalogItem && lead.sistema_interesse_id === catalogItem.id) || (selected.id === "optione" && isOptioneTrial(lead)));
  const leads30 = systemLeads.filter((lead) => new Date(lead.created_at).getTime() >= daysAgo(30)).length;
  const filteredLeads = systemLeads.filter((lead) => [lead.nome, lead.empresa ?? "", lead.email ?? "", lead.telefone ?? "", lead.observacoes ?? ""].join(" ").toLowerCase().includes(leadSearch.toLowerCase()));
  const isDesktop = Boolean(selected.releasesRepo);
  const host = new URL(selected.href).host;

  async function changeLeadStatus(lead: CommercialLead, status: string) {
    const { data, error } = await amtSupabase.from("manager_leads").update({ status, updated_at: new Date().toISOString() }).eq("id", lead.id).select("id,nome,empresa,email,telefone,origem,status,observacoes,sistema_interesse_id,created_at").single();
    if (error || !data) { setMessage("Não foi possível atualizar o status do lead."); return; }
    commercial.setLeads((items) => items.map((item) => item.id === lead.id ? data as CommercialLead : item));
    const session = await amtSupabase.auth.getSession();
    if (session.data.session) await amtSupabase.from("audit_logs").insert({ actor_user_id: session.data.session.user.id, action: "manager_lead.status_changed", resource_type: "manager_lead", resource_id: lead.id, metadata: { sistema: selected.catalogSlug, from: lead.status, to: status } });
    setMessage("Status do lead atualizado.");
  }

  const stats: Array<[string, string, string, IconType]> = [
    ["Planos ativos", commercial.loading ? "…" : String(activePlans.length), cheapest !== null ? `A partir de ${brl.format(cheapest)}/mês` : "Catálogo comercial do site", Package],
    [isDesktop ? "Testes grátis · 30 dias" : "Leads do site · 30 dias", commercial.leadsError ? "—" : commercial.loading ? "…" : String(leads30), commercial.leadsError ? "Acesso aos leads pendente" : `${systemLeads.length} no total`, Users],
    isDesktop
      ? ["Versão publicada", release?.loading ? "…" : release?.tag || "—", release?.error || (release?.publishedAt ? `${new Date(release.publishedAt).toLocaleDateString("pt-BR")} · ${release.downloads} downloads` : "Instalador Windows"), Download]
      : ["Versão no catálogo", catalogItem?.versao || "—", "Cadastro do sistema no catálogo", Code2],
    ["Produção", production.status === "verificando" ? "…" : production.status === "no ar" ? "No ar" : "Sem resposta", production.ms !== null ? `${host} · ${production.ms} ms` : host, Activity],
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Ecossistema AMT</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Sistemas</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Catálogo, leads, versões, código e infraestrutura de cada produto da AMT.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">{systems.length} sistemas</span>
            {systems.map((system) => <span key={system.id} className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{system.name.replace("AMT ", "")} · {system.platform}</span>)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {systems.map((system) => {
          const Icon = system.icon;
          const active = system.id === selected.id;
          return (
            <button key={system.id} type="button" onClick={() => { setSelectedId(system.id); setMessage(""); setLeadSearch(""); }} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${active ? "border-blue-500 ring-1 ring-blue-500/20" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100"><Icon className="h-5 w-5 text-slate-900" /></div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">{system.platform}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-950">{system.name}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">{system.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{system.capabilities.map((capability) => <span key={capability} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">{capability}</span>)}</div>
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-semibold text-slate-950">{selected.name}</h3>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{selected.platform}</span>
              {catalogItem && !catalogItem.ativo && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Inativo no catálogo</span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
          </div>
          <a href={selected.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Abrir sistema <ExternalLink className="h-4 w-4" /></a>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, detail, Icon]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="h-4 w-4 text-blue-700" />{label}</div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <PlatformSection key={selected.id} system={selected} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Acessos operacionais</h3>
          <p className="mt-1 text-sm text-slate-500">Painéis, páginas e serviços do sistema selecionado.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {selected.links.map(({ label, hint, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/30">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-slate-100 p-2"><Icon className="h-4 w-4 text-blue-700" /></span>
                  <span className="min-w-0"><span className="block text-sm font-medium text-slate-950">{label}</span><span className="block truncate text-[11px] text-slate-400">{hint}</span></span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">GitHub</h3>
          <p className="mt-1 text-sm text-slate-500">Repositório do código-fonte.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Repositório</p><p className="mt-1 truncate text-sm font-medium text-slate-950">{selected.githubRepo}</p></div>
            {github.loading ? <p className="text-xs text-slate-500">Consultando o GitHub…</p> : github.private ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs leading-5 text-slate-500">Repositório privado: a API pública do GitHub não mostra commits, issues e pull requests sem token. Abra o repositório para acompanhar.</div>
            ) : github.error ? <p className="text-xs font-medium text-red-600">{github.error}</p> : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Issues abertas</p><p className="mt-1 text-lg font-semibold text-slate-950">{github.issues}</p></div>
                  <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Pull requests</p><p className="mt-1 text-lg font-semibold text-slate-950">{github.prs}</p></div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Último commit</p><p className="mt-1 text-sm font-medium text-slate-950">{github.commit?.message ?? "Não disponível"}</p>{github.commit && <p className="mt-1 font-mono text-[10px] text-slate-400">{github.commit.sha.slice(0, 7)} · {new Date(github.commit.date).toLocaleString("pt-BR")}</p>}</div>
              </>
            )}
            {release && !release.loading && !release.error && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Última versão do instalador</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{release.tag}</p>
                <p className="mt-1 text-[11px] text-slate-400">Publicada em {new Date(release.publishedAt).toLocaleDateString("pt-BR")} · {release.downloads} downloads</p>
                <a href={release.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700">Ver release <ExternalLink className="h-3 w-3" /></a>
              </div>
            )}
            <a href={"https://github.com/" + selected.githubRepo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">Abrir GitHub <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Planos no catálogo</h3>
            <p className="mt-1 text-sm text-slate-500">Planos que o site exibe e vende para o {selected.name}{catalogItem?.trial_dias ? ` · teste grátis de ${catalogItem.trial_dias} dias` : ""}.</p>
          </div>
          {isDesktop && <p className="text-xs text-slate-400">Os códigos dos planos precisam ser os mesmos do sistema.</p>}
        </div>
        {commercial.loading ? <p className="mt-5 text-sm text-slate-500">Carregando…</p> : !catalogItem ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Sistema não encontrado no catálogo (manager_sistemas, slug {selected.catalogSlug}).</p>
        ) : systemPlans.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">Nenhum plano cadastrado para este sistema.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4 font-medium">Plano</th><th className="py-2 pr-4 font-medium">Código</th><th className="py-2 pr-4 font-medium">Mensal</th><th className="py-2 pr-4 font-medium">Anual</th><th className="py-2 font-medium">Situação</th></tr></thead>
              <tbody>
                {systemPlans.map((plan) => (
                  <tr key={plan.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">{plan.nome}{plan.destaque && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Destaque</span>}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{plan.slug}</td>
                    <td className="py-3 pr-4 text-slate-700">{plan.preco_mensal !== null ? brl.format(Number(plan.preco_mensal)) : "—"}</td>
                    <td className="py-3 pr-4 text-slate-700">{plan.preco_anual !== null ? brl.format(Number(plan.preco_anual)) : "—"}</td>
                    <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{plan.ativo ? "Ativo" : "Inativo"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">{isDesktop ? "Testes grátis e leads" : "Leads do site"}</h3>
            <p className="mt-1 text-sm text-slate-500">{isDesktop ? "Cada teste grátis feito pelo site vira um lead com o código da ótica e o fim do teste." : "Contatos comerciais interessados neste sistema."}</p>
          </div>
          <div className="flex gap-2">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="Buscar" className="w-48 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" /></label>
            <Button type="button" variant="outline" size="sm" onClick={() => void commercial.reload()} className="h-9 gap-2"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
          </div>
        </div>
        {message && <p className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">{message}</p>}
        {commercial.leadsError ? <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{commercial.leadsError}</p> : commercial.loading ? <p className="mt-5 text-sm text-slate-500">Carregando…</p> : filteredLeads.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">{systemLeads.length ? "Nenhum lead encontrado para a busca." : "Nenhum lead registrado para este sistema ainda."}</p>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-950">{lead.empresa || lead.nome}</p>
                    {isOptioneTrial(lead) && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Teste grátis</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{[lead.empresa ? lead.nome : null, lead.email, lead.telefone].filter(Boolean).join(" · ") || "Sem contato"} · {new Date(lead.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                  {lead.observacoes && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{lead.observacoes}</p>}
                </div>
                <select value={lead.status} onChange={(e) => void changeLeadStatus(lead, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
                  {commercialLeadStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  {!commercialLeadStatuses.some(([value]) => value === lead.status) && <option value={lead.status}>{lead.status}</option>}
                </select>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function DevelopmentModuleWorkspace() {
  const [view, setView] = useState<"central" | "prompt" | "agent">("central");
  const [projects, setProjects] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    repository: string | null;
    branch: string | null;
    production_url: string | null;
    stack: string | null;
    status: string;
  }>>([]);
  const [issues, setIssues] = useState<Array<{
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    module: string | null;
    priority: string;
    status: string;
  }>>([]);
  const [changes, setChanges] = useState<Array<{
    id: string;
    project_id: string;
    summary: string;
    commit_sha: string | null;
    files: string[];
    created_at: string;
  }>>([]);

  useEffect(() => {
    void Promise.all([
      amtSupabase.from("development_projects").select("id,name,description,repository,branch,production_url,stack,status").order("name"),
      amtSupabase.from("development_issues").select("id,project_id,title,description,module,priority,status").order("created_at", { ascending: false }),
      amtSupabase.from("development_changes").select("id,project_id,summary,commit_sha,files,created_at").order("created_at", { ascending: false }).limit(100),
    ]).then(([projectsResult, issuesResult, changesResult]) => {
      setProjects((projectsResult.data ?? []) as typeof projects);
      setIssues((issuesResult.data ?? []) as typeof issues);
      setChanges((changesResult.data ?? []) as typeof changes);
    });
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <button type="button" onClick={() => setView("central")} className={`rounded-lg px-3 py-2 text-sm font-medium ${view === "central" ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          Central de desenvolvimento
        </button>
        <button type="button" onClick={() => setView("prompt")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${view === "prompt" ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <SparklesIcon className="h-4 w-4" />
          Gerador de prompt
        </button>
        <button type="button" onClick={() => setView("agent")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${view === "agent" ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          <SparklesIcon className="h-4 w-4" />
          Agente GPT/Codex
        </button>
      </div>
      {view === "central" ? <DevelopmentWorkspace /> : view === "prompt" ? <PromptGeneratorWorkspace projects={projects} issues={issues} changes={changes} /> : <DevelopmentAgentWorkspace projects={projects} issues={issues} changes={changes} />}
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
