import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { amtSupabase } from "@/integrations/amt-supabase/client";

// Formulários: envios do formulário de contato do site (contatos_leads), como chegaram. Cada envio vira lead no
// funil automaticamente (gatilho no banco); daqui se abre o lead correspondente.

type Submission = { id: string; nome: string; empresa: string | null; email: string; telefone: string | null; segmento: string | null; mensagem: string; created_at: string };

export function FormsWorkspace() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [leadByContact, setLeadByContact] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const [contacts, leads] = await Promise.all([
      amtSupabase.from("contatos_leads").select("id,nome,empresa,email,telefone,segmento,mensagem,created_at").order("created_at", { ascending: false }).limit(300),
      amtSupabase.from("manager_leads").select("id,canal_ref").like("canal_ref", "contato:%").limit(1000),
    ]);
    if (contacts.error) {
      setMessage("Não foi possível carregar os envios do formulário.");
      setItems([]);
      return;
    }
    setMessage("");
    setItems((contacts.data ?? []) as Submission[]);
    setLeadByContact(
      Object.fromEntries(
        ((leads.data ?? []) as Array<{ id: string; canal_ref: string | null }>)
          .filter((l) => l.canal_ref?.startsWith("contato:"))
          .map((l) => [String(l.canal_ref).slice("contato:".length), l.id]),
      ),
    );
  }
  useEffect(() => {
    void load();
  }, []);

  const all = items ?? [];
  const since = (days: number) => all.filter((s) => new Date(s.created_at).getTime() >= Date.now() - days * 86400000).length;
  const term = search.trim().toLowerCase();
  const filtered = all.filter((s) => !term || [s.nome, s.empresa, s.email, s.telefone, s.segmento, s.mensagem].join(" ").toLowerCase().includes(term));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Formulários</h2>
          <p className="mt-1 text-sm text-slate-500">Envios do formulário de contato do site, como chegaram. Cada um já entra no funil de Leads.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {message ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[["Total", all.length], ["Últimos 7 dias", since(7)], ["Últimos 30 dias", since(30)]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{items === null ? "…" : String(value)}</p>
          </div>
        ))}
      </div>

      <label className="relative block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, empresa, e-mail, telefone ou mensagem" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
      </label>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.2fr_1.4fr_120px] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Contato</span>
            <span>Mensagem</span>
            <span>Data</span>
          </div>
          {items === null ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando envios…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Nenhum envio encontrado.</div>
          ) : (
            filtered.map((s) => (
              <button key={s.id} type="button" onClick={() => setSelected(s)} className={`grid w-full grid-cols-[1.2fr_1.4fr_120px] gap-4 border-b border-slate-100 px-5 py-3.5 text-left last:border-0 hover:bg-slate-50 ${selected?.id === s.id ? "bg-blue-50/60" : ""}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{s.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{s.empresa || s.email}</p>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{s.mensagem}</p>
                <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
              </button>
            ))
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? (
            <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">Selecione um envio para ver a mensagem completa.</div>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-950">{selected.nome}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{new Date(selected.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <dl className="space-y-2 text-xs">
                {[["Empresa", selected.empresa], ["E-mail", selected.email], ["Telefone", selected.telefone], ["Segmento", selected.segmento]].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="truncate text-slate-950">{value || "—"}</dd></div>
                ))}
              </dl>
              <div>
                <p className="text-xs text-slate-500">Mensagem</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">{selected.mensagem}</p>
              </div>
              {leadByContact[selected.id] ? (
                <Link to="/admin/leads" search={{ lead: leadByContact[selected.id] }} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800">
                  Abrir no funil de leads <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="text-xs text-slate-500">Contato somado a um lead que já estava aberto (mesmo e-mail ou telefone).</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
