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
  ShieldCheck,
  Users,
  Wrench,
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
  { label: "Segurança", icon: ShieldCheck, to: "/admin/seguranca" },
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
      .catch(() => navigate({ to: "/admin/login" }));

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
                  <Link to="/admin/seguranca" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
                    <span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-blue-700" /> Segurança</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
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
                    ["Segurança", ShieldCheck],
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
              <ShieldCheck className="h-4 w-4" />
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
  const descriptions: Record<string, string> = {
    Sistemas: "Gerencie os sistemas e integrações do ecossistema AMT.",
    Formulários: "Acompanhe formulários e solicitações recebidas.",
    Ferramentas: "Ferramentas administrativas e operacionais.",
    Segurança: "Controles de acesso, permissões e segurança.",
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

type Lead = { id: string; name: string; email: string | null; phone: string | null; source: string | null; status: string; notes: string | null; created_at: string };

function LeadsWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function loadLeads() {
    const { data } = await amtSupabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
  }

  useEffect(() => { void loadLeads(); }, []);

  async function createLead(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { data } = await amtSupabase.from("leads").insert({ ...form, name: form.name.trim() }).select("*").single();
    if (data) {
      setLeads((current) => [data as Lead, ...current]);
      setForm({ name: "", email: "", phone: "", source: "", notes: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function updateStatus(id: string, nextStatus: string) {
    const { data } = await amtSupabase.from("leads").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (data) setLeads((current) => current.map((lead) => lead.id === id ? data as Lead : lead));
  }

  const filtered = leads.filter((lead) => {
    const text = [lead.name, lead.email ?? "", lead.phone ?? ""].join(" ").toLowerCase();
    return (status === "todos" || lead.status === status) && text.includes(search.toLowerCase());
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold">Leads e CRM</h2><p className="mt-1 text-sm text-slate-500">{leads.length} lead(s) cadastrados</p></div>
        <Button onClick={() => setShowForm((value) => !value)} className="gap-2 bg-blue-700 hover:bg-blue-800"><Plus className="h-4 w-4" /> Novo lead</Button>
      </div>
      {showForm && <form onSubmit={createLead} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        {([["name","Nome *"],["email","E-mail"],["phone","Telefone"],["source","Origem"]] as const).map(([key,label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input value={form[key]} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>)}
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Observações<textarea value={form.notes} onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Cadastrar lead"}</Button></div>
      </form>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="todos">Todos os status</option><option value="novo">Novo</option><option value="contatado">Contatado</option><option value="qualificado">Qualificado</option><option value="convertido">Convertido</option><option value="perdido">Perdido</option></select>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_160px] gap-4 border-b border-slate-200 bg-white px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-950 md:grid"><span>Lead</span><span>Contato</span><span>Origem</span><span>Status</span></div>
        {filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Nenhum lead encontrado.</div> : filtered.map((lead) => <div key={lead.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[1.5fr_1fr_1fr_160px] md:items-center md:gap-4"><div><p className="font-medium">{lead.name}</p><p className="mt-1 text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p></div><div className="text-sm text-slate-600">{lead.email || lead.phone || "—"}</div><div className="text-sm text-slate-600">{lead.source || "—"}</div><select value={lead.status} onChange={(e) => void updateStatus(lead.id, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"><option value="novo">Novo</option><option value="contatado">Contatado</option><option value="qualificado">Qualificado</option><option value="convertido">Convertido</option><option value="perdido">Perdido</option></select></div>)}
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
