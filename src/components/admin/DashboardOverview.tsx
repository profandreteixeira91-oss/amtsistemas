import { useEffect, useState } from "react";
import {
  Boxes,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Glasses,
  Swords,
  Users,
} from "lucide-react";

import { SystemSubscriptionSummary } from "@/components/admin/SystemsWorkspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { amtSupabase } from "@/integrations/amt-supabase/client";
import { systems, daysAgo, useCommercialData, isOptioneTrial, pad, type AuditLog } from "@/lib/admin/systems";

// Dashboard do Control Center: indicadores, sistemas, acessos rápidos, testes grátis e atividade recente.

export function DashboardOverview({ onOpen }: { onOpen: (module: string) => void }) {
  const commercial = useCommercialData();
  const [counts, setCounts] = useState<{ leads: number | null; forms: number | null; newForms: number | null }>({ leads: null, forms: null, newForms: null });
  const [activity, setActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    void Promise.all([
      // Leads em aberto no funil e contatos do formulário do site (últimos 30 dias / total).
      amtSupabase.from("manager_leads").select("id", { count: "exact", head: true }).not("status", "in", "(ganho,perdido)"),
      amtSupabase.from("contatos_leads").select("id", { count: "exact", head: true }),
      amtSupabase.from("contatos_leads").select("id", { count: "exact", head: true }).gte("created_at", new Date(daysAgo(30)).toISOString()),
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
    { label: "Leads em aberto", value: show(counts.leads), detail: "Funil: site, chat, testes e cadastros", icon: Users, module: "Leads" },
    { label: "Contatos pelo site", value: show(counts.newForms), detail: counts.forms === null ? "Formulário de contato" : `Últimos 30 dias · ${counts.forms} no total`, icon: FileText, module: "Formulários" },
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

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
      <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-blue-700" /> {label}</span>
      <ExternalLink className="h-4 w-4 text-slate-400" />
    </a>
  );
}
