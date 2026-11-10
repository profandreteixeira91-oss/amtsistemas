import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";
import { commercialLeadStatuses } from "@/lib/admin/systems";

// Leads: funil único do Control Center (manager_leads, a mesma tabela do CRM). Entram aqui o formulário do site
// (gatilho em contatos_leads), o chat do site, os testes grátis do AMT OptiOne e os cadastros manuais.

type FunnelLead = {
  id: string;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  status: string;
  sistema_interesse_id: string | null;
  observacoes: string | null;
  proximo_contato: string | null;
  canal_ref: string | null;
  created_at: string;
  updated_at: string;
};
type CatalogItem = { id: string; nome: string };

const LEAD_COLUMNS = "id,nome,empresa,email,telefone,origem,status,sistema_interesse_id,observacoes,proximo_contato,canal_ref,created_at,updated_at";
const CLOSED = ["ganho", "perdido"];
const ORIGINS: Array<{ key: string; label: string }> = [
  { key: "site-contato", label: "Formulário do site" },
  { key: "chat-site", label: "Chat do site" },
  { key: "teste-gratis-amt-optione", label: "Teste grátis OptiOne" },
  { key: "manual", label: "Cadastro manual" },
];
const STATUS_LABEL = Object.fromEntries(commercialLeadStatuses) as Record<string, string>;
const STATUS_CLASS: Record<string, string> = {
  novo: "bg-blue-50 text-blue-700",
  contatado: "bg-indigo-50 text-indigo-700",
  qualificado: "bg-violet-50 text-violet-700",
  proposta: "bg-amber-50 text-amber-800",
  negociacao: "bg-orange-50 text-orange-800",
  ganho: "bg-emerald-50 text-emerald-700",
  perdido: "bg-slate-100 text-slate-500",
};
const originLabel = (origem: string | null) => ORIGINS.find((o) => o.key === origem)?.label ?? (origem || "Sem origem");
const emptyForm = { nome: "", empresa: "", email: "", telefone: "", sistema_interesse_id: "", observacoes: "" };
const daysAgo = (days: number) => Date.now() - days * 86400000;

/** Link do WhatsApp para o telefone do lead (DDI 55 quando vier só com DDD). */
function whatsappLink(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

async function audit(action: string, id: string, metadata: Record<string, unknown>) {
  const { data } = await amtSupabase.auth.getSession();
  if (data.session) await amtSupabase.from("audit_logs").insert({ actor_user_id: data.session.user.id, action, resource_type: "manager_lead", resource_id: id, metadata });
}

export function LeadsWorkspace({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [leads, setLeads] = useState<FunnelLead[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("abertos");
  const [origin, setOrigin] = useState("todas");
  const [message, setMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [leadRows, systems] = await Promise.all([
      amtSupabase.from("manager_leads").select(LEAD_COLUMNS).order("created_at", { ascending: false }).limit(1000),
      amtSupabase.from("manager_sistemas").select("id,nome").order("nome"),
    ]);
    if (leadRows.error) {
      setMessage("Não foi possível carregar os leads.");
      setLeads([]);
      return;
    }
    setLeads((leadRows.data ?? []) as FunnelLead[]);
    setCatalog((systems.data ?? []) as CatalogItem[]);
  }
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const all = useMemo(() => leads ?? [], [leads]);
  const systemName = (id: string | null) => catalog.find((s) => s.id === id)?.nome ?? null;
  const selected = all.find((l) => l.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const open = all.filter((l) => !CLOSED.includes(l.status));
    const won = all.filter((l) => l.status === "ganho").length;
    const lost = all.filter((l) => l.status === "perdido").length;
    return {
      open: open.length,
      new7: all.filter((l) => new Date(l.created_at).getTime() >= daysAgo(7)).length,
      negotiating: open.filter((l) => l.status !== "novo").length,
      won,
      conversion: won + lost ? Math.round((won / (won + lost)) * 100) : null,
      byStatus: Object.fromEntries(commercialLeadStatuses.map(([key]) => [key, all.filter((l) => l.status === key).length])) as Record<string, number>,
    };
  }, [all]);

  const filtered = all.filter((l) => {
    const term = search.trim().toLowerCase();
    const text = [l.nome, l.empresa, l.email, l.telefone, l.observacoes].join(" ").toLowerCase();
    const statusOk = status === "todos" || (status === "abertos" ? !CLOSED.includes(l.status) : l.status === status);
    const originOk = origin === "todas" || (origin === "outras" ? !ORIGINS.some((o) => o.key === l.origem) : l.origem === origin);
    return statusOk && originOk && (!term || text.includes(term));
  });

  async function update(lead: FunnelLead, patch: Partial<FunnelLead>, auditAction?: string) {
    const { data, error } = await amtSupabase.from("manager_leads").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", lead.id).select(LEAD_COLUMNS).single();
    if (error || !data) {
      setMessage("Não foi possível salvar o lead.");
      return;
    }
    setLeads((items) => (items ?? []).map((l) => (l.id === lead.id ? (data as FunnelLead) : l)));
    if (auditAction) await audit(auditAction, lead.id, { nome: lead.nome, from: lead.status, to: patch.status });
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSaving(true);
    setMessage("");
    const { data, error } = await amtSupabase
      .from("manager_leads")
      .insert({
        nome: form.nome.trim(),
        empresa: form.empresa.trim() || null,
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        sistema_interesse_id: form.sistema_interesse_id || null,
        observacoes: form.observacoes.trim() || null,
        origem: "manual",
        status: "novo",
      })
      .select(LEAD_COLUMNS)
      .single();
    setSaving(false);
    if (error || !data) {
      setMessage(error?.message ?? "Não foi possível cadastrar o lead.");
      return;
    }
    const lead = data as FunnelLead;
    setLeads((items) => [lead, ...(items ?? [])]);
    await audit("manager_lead.created", lead.id, { nome: lead.nome });
    setForm(emptyForm);
    setShowNew(false);
    onSelect(lead.id);
  }

  async function remove(lead: FunnelLead) {
    if (!window.confirm(`Excluir o lead ${lead.nome}? Essa ação não pode ser desfeita.`)) return;
    const { error } = await amtSupabase.from("manager_leads").delete().eq("id", lead.id);
    if (error) {
      setMessage("Não foi possível excluir o lead.");
      return;
    }
    await audit("manager_lead.deleted", lead.id, { nome: lead.nome });
    setLeads((items) => (items ?? []).filter((l) => l.id !== lead.id));
    onSelect(null);
  }

  const cards: Array<[string, string, string]> = [
    ["Em aberto", String(counts.open), "Leads ainda em negociação"],
    ["Novos em 7 dias", String(counts.new7), "Entraram na última semana"],
    ["Em andamento", String(counts.negotiating), "Contatados até negociação"],
    ["Ganhos", String(counts.won), counts.conversion === null ? "Sem leads encerrados" : `${counts.conversion}% de conversão`],
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Leads</h2>
          <p className="mt-1 text-sm text-slate-500">Funil único: formulário e chat do site, testes grátis do OptiOne e cadastros manuais.</p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)} className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> Novo lead
        </Button>
      </div>

      {message ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, detail]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{leads === null ? "…" : value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
          </div>
        ))}
      </div>

      {showNew ? (
        <form onSubmit={create} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h3 className="font-semibold">Novo lead</h3>
            <p className="text-xs text-slate-500">Cadastro manual (indicação, ligação, evento).</p>
          </div>
          {([["nome", "Nome *"], ["empresa", "Empresa"], ["email", "E-mail"], ["telefone", "WhatsApp / telefone"]] as const).map(([key, label]) => (
            <label key={key} className="text-sm font-medium text-slate-700">
              {label}
              <input required={key === "nome"} value={form[key]} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" />
            </label>
          ))}
          <label className="text-sm font-medium text-slate-700">
            Sistema de interesse
            <select value={form.sistema_interesse_id} onChange={(e) => setForm((v) => ({ ...v, sistema_interesse_id: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
              <option value="">Não definido</option>
              {catalog.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Observações
            <textarea value={form.observacoes} onChange={(e) => setForm((v) => ({ ...v, observacoes: e.target.value }))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving} className="bg-black text-white hover:bg-slate-900">{saving ? "Salvando…" : "Cadastrar lead"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, empresa, e-mail, telefone ou anotação" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950" aria-label="Etapa">
            <option value="abertos">Em aberto</option>
            <option value="todos">Todas as etapas</option>
            {commercialLeadStatuses.map(([key, label]) => <option key={key} value={key}>{label} ({counts.byStatus[key] ?? 0})</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ key: "todas", label: "Todas as origens" }, ...ORIGINS, { key: "outras", label: "Outras" }].map((o) => (
            <button key={o.key} type="button" onClick={() => setOrigin(o.key)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${origin === o.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_130px] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Lead</span>
            <span>Origem</span>
            <span>Etapa</span>
          </div>
          {leads === null ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando leads…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Nenhum lead encontrado.</div>
          ) : (
            filtered.map((lead) => (
              <button key={lead.id} type="button" onClick={() => onSelect(lead.id)} className={`grid w-full grid-cols-[1.4fr_1fr_130px] gap-4 border-b border-slate-100 px-5 py-3.5 text-left last:border-0 hover:bg-slate-50 ${selectedId === lead.id ? "bg-blue-50/60" : ""}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{lead.empresa || lead.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{[lead.empresa ? lead.nome : null, lead.email || lead.telefone].filter(Boolean).join(" · ") || "Sem contato"}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">{originLabel(lead.origem)}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[lead.status] ?? "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[lead.status] ?? lead.status}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? (
            <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">Selecione um lead para ver e atualizar.</div>
          ) : (
            <LeadDetail key={selected.id} lead={selected} catalog={catalog} systemName={systemName(selected.sistema_interesse_id)} onUpdate={update} onRemove={remove} />
          )}
        </aside>
      </div>
    </section>
  );
}

function LeadDetail({
  lead,
  catalog,
  systemName,
  onUpdate,
  onRemove,
}: {
  lead: FunnelLead;
  catalog: CatalogItem[];
  systemName: string | null;
  onUpdate: (lead: FunnelLead, patch: Partial<FunnelLead>, auditAction?: string) => Promise<void>;
  onRemove: (lead: FunnelLead) => Promise<void>;
}) {
  const [notes, setNotes] = useState(lead.observacoes ?? "");
  const whatsapp = whatsappLink(lead.telefone);
  const conversation = lead.canal_ref?.startsWith("whatsapp:") ? lead.canal_ref.slice("whatsapp:".length) : null;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-semibold text-slate-950">{lead.empresa || lead.nome}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {lead.empresa ? `${lead.nome} · ` : ""}
          {originLabel(lead.origem)} · desde {new Date(lead.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        ) : null}
        {lead.email ? (
          <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Mail className="h-3.5 w-3.5" /> E-mail
          </a>
        ) : null}
        {conversation ? (
          <Link to="/admin/whatsapp" search={{ conversa: conversation }} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
            <MessageCircle className="h-3.5 w-3.5" /> Abrir conversa do chat
          </Link>
        ) : null}
      </div>

      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">E-mail</dt><dd className="truncate text-slate-950">{lead.email || "—"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Telefone</dt><dd className="text-slate-950">{lead.telefone || "—"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Sistema de interesse</dt><dd className="text-slate-950">{systemName ?? "—"}</dd></div>
      </dl>

      <label className="block">
        <span className="text-xs text-slate-500">Etapa</span>
        <select value={lead.status} onChange={(e) => void onUpdate(lead, { status: e.target.value }, "manager_lead.status_changed")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
          {commercialLeadStatuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-slate-500">Sistema de interesse</span>
        <select value={lead.sistema_interesse_id ?? ""} onChange={(e) => void onUpdate(lead, { sistema_interesse_id: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950">
          <option value="">Não definido</option>
          {catalog.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-slate-500">Próximo contato</span>
        <input type="date" value={lead.proximo_contato ?? ""} onChange={(e) => void onUpdate(lead, { proximo_contato: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
      </label>
      <label className="block">
        <span className="text-xs text-slate-500">Anotações</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500" />
      </label>
      {notes !== (lead.observacoes ?? "") ? (
        <Button size="sm" onClick={() => void onUpdate(lead, { observacoes: notes || null })} className="bg-black text-white hover:bg-slate-900">Salvar anotações</Button>
      ) : null}
      <button type="button" onClick={() => void onRemove(lead)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
        <Trash2 className="h-4 w-4" /> Excluir lead
      </button>
    </div>
  );
}
