import { useEffect, useState } from "react";
import { ArrowLeft, LifeBuoy, Loader2, MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SupportWhatsAppWorkspace } from "@/components/admin/SupportWhatsAppWorkspace";
import { inbox } from "@/lib/support-inbox";

// Atendimento no Control Center: WhatsApp do suporte e chamados do Dojo Manager.
// Os chamados são lidos do banco do Dojo pela Edge Function support-inbox; a resposta vai pelo endpoint
// support-reply do Dojo, que grava a mensagem no chamado e avisa a academia (push).

type Ticket = {
  id: string;
  code: string;
  owner_id: string;
  academy_name: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string | null;
  last_message_at: string | null;
  unread_by_admin: number;
  unread_by_client: number;
  created_at: string;
};
type TicketMessage = { id: string; author_role: "client" | "support" | string; body: string; created_at: string };

const STATUS: Record<string, { label: string; className: string }> = {
  aberto: { label: "Aberto", className: "bg-blue-50 text-blue-700" },
  em_atendimento: { label: "Em atendimento", className: "bg-amber-50 text-amber-800" },
  resolvido: { label: "Resolvido", className: "bg-emerald-50 text-emerald-700" },
  fechado: { label: "Fechado", className: "bg-slate-100 text-slate-500" },
};
const CATEGORY: Record<string, string> = { duvida: "Dúvida", solicitacao: "Solicitação", modulo: "Módulo", sugestao: "Sugestão", bug: "Erro / bug", outro: "Outro" };
const statusInfo = (s: string) => STATUS[s] ?? { label: s.replace("_", " "), className: "bg-slate-100 text-slate-600" };
const when = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export function SupportAttendanceWorkspace() {
  const [tab, setTab] = useState<"whatsapp" | "chamados">("whatsapp");
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
          { id: "chamados" as const, label: "Chamados do Dojo Manager", icon: LifeBuoy },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${tab === id ? "bg-black text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === "whatsapp" ? <SupportWhatsAppWorkspace /> : <SupportTicketsWorkspace />}
    </section>
  );
}

function SupportTicketsWorkspace() {
  const [filter, setFilter] = useState<"abertos" | "todos">("abertos");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  async function load(current = filter) {
    try {
      setTickets(await inbox<Ticket[]>("tickets_list", { filter: current }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar os chamados.");
    }
  }
  useEffect(() => {
    setTickets(null);
    void load(filter);
    const timer = window.setInterval(() => void load(filter), 15000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const unread = (tickets ?? []).filter((t) => t.unread_by_admin > 0).length;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Chamados do Dojo Manager</h2>
        <p className="mt-1 text-sm text-slate-500">
          Abertos pelas academias em Suporte, no Dojo Manager. A resposta aparece na tela do chamado e a academia recebe um aviso. {unread ? `${unread} chamado(s) com mensagem nova.` : ""}
        </p>
      </div>
      <div className="grid h-[calc(100dvh-17rem)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`flex min-h-0 flex-col border-r border-slate-200 ${selected ? "hidden lg:flex" : "flex"}`}>
          <div className="flex gap-1 border-b border-slate-200 p-3">
            {(["abertos", "todos"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${filter === f ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {f === "abertos" ? "Em aberto" : "Todos"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error ? (
              <p className="p-4 text-sm text-red-600">{error}</p>
            ) : tickets === null ? (
              <p className="p-4 text-sm text-slate-500">Carregando chamados…</p>
            ) : tickets.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Nenhum chamado {filter === "abertos" ? "em aberto" : ""}.</p>
            ) : (
              tickets.map((t) => {
                const s = statusInfo(t.status);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={`block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 ${selected === t.id ? "bg-blue-50/60" : ""}`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm text-slate-950 ${t.unread_by_admin ? "font-bold" : "font-medium"}`}>{t.subject}</span>
                      <span className="shrink-0 text-[11px] text-slate-500">{when(t.last_message_at ?? t.created_at)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">{t.academy_name} · #{t.code}</span>
                      {t.unread_by_admin ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">{t.unread_by_admin}</span> : null}
                    </span>
                    <span className={`mt-1 inline-block rounded px-1.5 text-[10px] font-medium ${s.className}`}>{s.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>
        {selected ? (
          <TicketThread key={selected} id={selected} onBack={() => setSelected(null)} onChanged={() => void load()} />
        ) : (
          <div className="hidden flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500 lg:flex">
            <LifeBuoy className="h-10 w-10 text-blue-600/30" />
            Escolha um chamado para responder.
          </div>
        )}
      </div>
    </section>
  );
}

function TicketThread({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [data, setData] = useState<{ ticket: Ticket; messages: TicketMessage[] } | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  async function load() {
    try {
      setData(await inbox<{ ticket: Ticket; messages: TicketMessage[] }>("ticket_get", { id }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível abrir o chamado.");
    }
  }
  useEffect(() => {
    void load().then(onChanged);
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError("");
    try {
      await inbox("ticket_reply", { id, body, ...(status ? { status } : {}) });
      setText("");
      setStatus("");
      await load();
      onChanged();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Não foi possível enviar a resposta.");
    } finally {
      setSending(false);
    }
  }

  if (error && !data) return <div className="grid place-items-center p-6 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="grid place-items-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const t = data.ticket;
  const s = statusInfo(t.status);

  return (
    <section className="flex min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
        <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onBack} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-slate-950">{t.subject}</div>
          <div className="truncate text-xs text-slate-500">
            {t.academy_name} · #{t.code} · {CATEGORY[t.category ?? ""] ?? t.category ?? "—"}{t.priority ? ` · prioridade ${t.priority}` : ""}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>{s.label}</span>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
        {data.messages.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Sem mensagens neste chamado.</p> : null}
        {data.messages.map((m) => {
          const mine = m.author_role === "support";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-blue-600 text-white" : "bg-white text-slate-900"}`}>
                <div className={`mb-0.5 text-[11px] font-medium ${mine ? "text-white/75" : "text-slate-500"}`}>{mine ? "Suporte AMT" : t.academy_name}</div>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={`mt-1 text-right text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <footer className="space-y-2 border-t border-slate-200 bg-white p-2">
        {sendError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{sendError}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Resposta para a academia · Enter envia"
            className="max-h-40 min-h-12 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500"
          />
          <div className="flex shrink-0 flex-col gap-1.5">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700" aria-label="Situação após responder">
              <option value="">Situação: automática</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
            <Button size="sm" disabled={!text.trim() || sending} onClick={() => void send()} className="gap-1.5 bg-blue-700 text-white hover:bg-blue-800">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Responder
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}
