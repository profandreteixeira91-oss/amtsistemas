import { useEffect, useState } from "react";
import { ArrowLeft, LifeBuoy, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inbox } from "@/lib/support-inbox";

// Chamados do Dojo Manager dentro da caixa do WhatsApp do /admin. São lidos do banco do Dojo pela Edge
// Function support-inbox; a resposta vai pelo endpoint support-reply do Dojo, que grava a mensagem no chamado
// (o dono vê em Suporte, no Dojo) e avisa a academia por push.

export type Ticket = {
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

/** Linha do chamado na lista de conversas do WhatsApp. */
export function TicketRow({ ticket: t, selected, onSelect }: { ticket: Ticket; selected: boolean; onSelect: () => void }) {
  const s = statusInfo(t.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-3 border-b border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 ${selected ? "bg-blue-50/60" : ""}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
        <LifeBuoy className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm text-slate-950 ${t.unread_by_admin ? "font-bold" : "font-medium"}`}>{t.academy_name}</span>
          <span className={`shrink-0 text-[11px] ${t.unread_by_admin ? "font-semibold text-blue-700" : "text-slate-500"}`}>{when(t.last_message_at ?? t.created_at)}</span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-slate-500">#{t.code} · {t.subject}</span>
          {t.unread_by_admin ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">{t.unread_by_admin}</span> : null}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-1">
          <span className="rounded bg-blue-600 px-1.5 text-[10px] font-medium text-white">Chamado</span>
          <span className={`rounded px-1.5 text-[10px] font-medium ${s.className}`}>{s.label}</span>
        </span>
      </span>
    </button>
  );
}

export function TicketThread({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
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
          <div className="truncate font-semibold text-slate-950">Chamado #{t.code} · {t.subject}</div>
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
