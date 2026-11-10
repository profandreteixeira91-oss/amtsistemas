import { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";
import { type AuditLog } from "@/lib/admin/systems";

// Histórico de ações administrativas (audit_logs).

export function AuditWorkspace() {
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
