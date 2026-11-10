import { useEffect, useState } from "react";
import {
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";
import { type FormSubmission } from "@/lib/admin/systems";

// Formulários e solicitações recebidas.

export function FormsWorkspace() {
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
