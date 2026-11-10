import { useEffect, useState } from "react";
import {
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";

// Leads e CRM do Control Center.

type Lead = { id: string; name: string; email: string | null; phone: string | null; source: string | null; status: string; notes: string | null; created_at: string };

export function LeadsWorkspace() {
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
