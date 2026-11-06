import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCheck,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  LogOut,
  MessageCircle,
  Mic,
  Paperclip,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TicketRow, TicketThread, type Ticket } from "@/components/admin/SupportTicket";
import { inbox } from "@/lib/support-inbox";

// Caixa de entrada do WhatsApp do suporte AMT (instância amt-suporte, o número 551151040791), no mesmo esquema
// da caixa da loja na AMT Fight Wear. Recebe também as conversas iniciadas pelo chat do site (etiqueta "Site").
// Tudo passa pela Edge Function support-inbox do projeto do Dojo, que confere o login do Control Center.

const DOJO_SUPPORT_URL = "https://amtdojomanager.com.br";

type Status = {
  configured: boolean;
  instance: string | null;
  state: "open" | "connecting" | "close" | null;
  connected: boolean;
  number: string | null;
  profileName: string | null;
  webhookActive: boolean;
  ticketReplies: boolean;
  chats: number;
  error: string | null;
};
type Chat = {
  id: string;
  remote_jid: string;
  phone_normalized: string | null;
  name: string | null;
  academy_owner_id: string | null;
  academy: { owner_id: string; name: string } | null;
  is_self: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_from_me: boolean | null;
  unread_count: number;
  tags: string[];
  archived: boolean;
  follow_up_at: string | null;
  follow_up_note: string | null;
};
type Message = {
  id: string;
  message_id: string;
  from_me: boolean;
  type: string;
  body: string | null;
  media_mime: string | null;
  media_name: string | null;
  quoted_body: string | null;
  status: string | null;
  sent_at: string;
};
type QuickReply = { id: string; title: string; body: string };
type AcademyOption = { owner_id: string; name: string; email: string | null; phone: string | null; city: string | null };
type AcademySummary = {
  owner_id: string;
  name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  subscription: { status: string | null; group: string; amount_monthly: number | null; trial_ends_at: string | null; current_period_end: string | null; next_due_date: string | null };
  students: number;
  active_students: number;
  open_tickets: Array<{ id: string; code: string; subject: string; status: string; priority: string | null; last_message_at: string }>;
};

type Filter = "todas" | "nao_lidas" | "chamados" | "academias" | "sem_academia" | "retorno" | "arquivadas";
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "todas", label: "Todas" },
  { key: "nao_lidas", label: "Não lidas" },
  { key: "chamados", label: "Chamados" },
  { key: "academias", label: "Academias" },
  { key: "sem_academia", label: "Sem academia" },
  { key: "retorno", label: "Retorno agendado" },
  { key: "arquivadas", label: "Arquivadas" },
];
const CHAT_TAGS = ["Site", "Dúvida", "Erro", "Financeiro", "Implantação", "Comercial", "Urgente"];
const GROUP_LABEL: Record<string, { label: string; className: string }> = {
  pagante: { label: "Pagante", className: "bg-emerald-50 text-emerald-700" },
  liberado: { label: "Liberado", className: "bg-sky-50 text-sky-700" },
  teste: { label: "Em teste", className: "bg-blue-50 text-blue-700" },
  teste_vencido: { label: "Teste vencido", className: "bg-amber-50 text-amber-700" },
  pendente: { label: "Pendente", className: "bg-red-50 text-red-700" },
  cancelado: { label: "Cancelado", className: "bg-slate-100 text-slate-500" },
  sem_assinatura: { label: "Sem assinatura", className: "bg-slate-100 text-slate-500" },
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const todayISO = () => new Date().toLocaleDateString("sv-SE");
const formatBR = (value: string | null | undefined) =>
  value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("pt-BR") : "";
const chatTitle = (c: Chat) =>
  c.is_self ? "Você (mensagens para si mesmo)" : c.academy?.name || c.name || (c.phone_normalized ? `+${c.phone_normalized}` : "Contato do WhatsApp");
const time = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};
const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Troca {nome} pelo primeiro nome; sem nome, tira o vocativo ("Olá, {nome}!" vira "Olá!"). */
function fillName(body: string, firstName: string) {
  if (firstName) return body.replace(/\{nome\}/g, firstName);
  const text = body.replace(/,\s*\{nome\}/g, "").replace(/\{nome\},?\s*/g, "").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const CLOSED_TICKET = ["resolvido", "fechado"];
type ListItem = { kind: "chat"; key: string; at: string; chat: Chat } | { kind: "ticket"; key: string; at: string; ticket: Ticket };

export function SupportWhatsAppWorkspace() {
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [listError, setListError] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function loadStatus() {
    try {
      setStatus(await inbox<Status>("status"));
      setStatusError("");
    } catch (e) {
      setStatusError(errorText(e, "Não foi possível consultar o WhatsApp do suporte."));
    }
  }
  async function loadChats(current: Filter = filter) {
    try {
      // Filtro "Chamados" mostra só os chamados; as conversas usam o filtro equivalente do WhatsApp.
      const [chatRows, ticketRows] = await Promise.all([
        current === "chamados" ? Promise.resolve([] as Chat[]) : inbox<Chat[]>("list", { filter: current }),
        ["todas", "nao_lidas", "chamados", "academias", "arquivadas"].includes(current)
          ? inbox<Ticket[]>("tickets_list", { filter: current === "arquivadas" ? "todos" : "abertos" })
          : Promise.resolve([] as Ticket[]),
      ]);
      setChats(chatRows);
      setTickets(
        ticketRows.filter((t) =>
          current === "arquivadas" ? CLOSED_TICKET.includes(t.status) : current === "nao_lidas" ? t.unread_by_admin > 0 : true,
        ),
      );
      setListError("");
    } catch (e) {
      setListError(errorText(e, "Não foi possível carregar as conversas."));
    }
  }

  useEffect(() => {
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 20000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    setChats(null);
    setTickets(null);
    void loadChats(filter);
    const timer = window.setInterval(() => void loadChats(filter), 8000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    const items: ListItem[] = [
      ...(chats ?? [])
        .filter(
          (c) =>
            !term ||
            chatTitle(c).toLowerCase().includes(term) ||
            (c.last_message_preview ?? "").toLowerCase().includes(term) ||
            (digits.length >= 4 && (c.phone_normalized ?? "").includes(digits)),
        )
        .map((c) => ({ kind: "chat" as const, key: c.id, at: c.last_message_at ?? "", chat: c })),
      ...(tickets ?? [])
        .filter((t) => !term || [t.academy_name, t.subject, t.code].some((v) => v.toLowerCase().includes(term.replace(/^#/, ""))))
        .map((t) => ({ kind: "ticket" as const, key: `t:${t.id}`, at: t.last_message_at ?? t.created_at, ticket: t })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [chats, tickets, q]);
  const unread = (chats ?? []).filter((c) => c.unread_count > 0).length + (tickets ?? []).filter((t) => t.unread_by_admin > 0).length;
  const selectedTicket = selected?.startsWith("t:") ? (tickets ?? []).find((t) => `t:${t.id}` === selected) ?? null : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">WhatsApp do suporte</h2>
          <p className="mt-1 text-sm text-slate-500">
            {status?.connected
              ? `Número do suporte${status.number ? ` (+${status.number})` : ""} e chamados do Dojo Manager · ${unread} não lida(s)`
              : "Conversas do número do suporte e chamados abertos pelas academias no Dojo Manager."}
          </p>
        </div>
        {status?.connected ? <DisconnectButton onDone={() => void loadStatus()} /> : null}
      </div>

      {statusError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{statusError}</p> : null}
      {notice ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{notice}</p> : null}
      {status ? <InboxSetup status={status} onChanged={() => { void loadStatus(); void loadChats(); }} onNotice={setNotice} /> : null}

      <div className="grid h-[calc(100dvh-15rem)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className={`flex min-h-0 flex-col border-r border-slate-200 ${selected ? "hidden lg:flex" : "flex"}`}>
          <div className="space-y-2 border-b border-slate-200 p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversa" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500" />
            </label>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${filter === f.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listError ? (
              <p className="p-4 text-sm text-red-600">{listError}</p>
            ) : chats === null || tickets === null ? (
              <p className="p-4 text-sm text-slate-500">Carregando conversas…</p>
            ) : visible.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Nenhuma conversa.</p>
            ) : (
              visible.map((item) => item.kind === "ticket" ? (
                <TicketRow key={item.key} ticket={item.ticket} selected={selected === item.key} onSelect={() => setSelected(item.key)} />
              ) : ((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 ${selected === c.id ? "bg-blue-50/60" : ""}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${c.is_self ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"}`}>
                    {chatTitle(c).replace(/[^A-Za-zÀ-ú0-9]/g, "").slice(0, 1).toUpperCase() || "#"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm text-slate-950 ${c.unread_count ? "font-bold" : "font-medium"}`}>{chatTitle(c)}</span>
                      <span className={`shrink-0 text-[11px] ${c.unread_count ? "font-semibold text-emerald-700" : "text-slate-500"}`}>{time(c.last_message_at)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500">
                        {c.last_message_from_me ? "Você: " : ""}
                        {c.last_message_preview ?? ""}
                      </span>
                      {c.unread_count ? (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white">{c.unread_count}</span>
                      ) : null}
                    </span>
                    {c.academy || c.tags.length || c.follow_up_at ? (
                      <span className="mt-0.5 flex flex-wrap gap-1">
                        {c.academy ? <span className="rounded bg-blue-50 px-1.5 text-[10px] font-medium text-blue-700">Academia</span> : null}
                        {c.tags.map((t) => (
                          <span key={t} className="rounded bg-slate-100 px-1.5 text-[10px] text-slate-600">{t}</span>
                        ))}
                        {c.follow_up_at ? (
                          <span className={`rounded px-1.5 text-[10px] ${c.follow_up_at <= todayISO() ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>Retorno {formatBR(c.follow_up_at)}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))(item.chat))
            )}
          </div>
        </aside>

        {selected?.startsWith("t:") ? (
          <>
            <TicketThread key={selected} id={selected.slice(2)} onBack={() => setSelected(null)} onChanged={() => void loadChats()} />
            <TicketAcademyPanel ownerId={selectedTicket?.owner_id ?? null} />
          </>
        ) : selected ? (
          <Conversation key={selected} chatId={selected} onBack={() => setSelected(null)} onChanged={() => void loadChats()} />
        ) : (
          <div className="hidden min-h-0 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-500 lg:flex xl:col-span-2">
            <MessageCircle className="h-10 w-10 text-emerald-600/40" />
            Escolha uma conversa ou um chamado para responder pelo admin.
          </div>
        )}
      </div>
    </section>
  );
}

/** Conexão do número, ativação do webhook e importação do histórico (aparece enquanto falta configurar). */
function InboxSetup({ status, onChanged, onNotice }: { status: Status; onChanged: () => void; onNotice: (text: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [qr, setQr] = useState<{ base64: string | null; pairingCode: string | null } | null>(null);
  const [pairNumber, setPairNumber] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Enquanto o QR está na tela, confere a conexão a cada 4 s.
  useEffect(() => {
    if (!qr || status.connected) return;
    const timer = window.setInterval(onChanged, 4000);
    return () => window.clearInterval(timer);
  }, [qr, status.connected, onChanged]);
  useEffect(() => {
    if (status.connected && qr) {
      setQr(null);
      onNotice("WhatsApp do suporte conectado.");
    }
  }, [status.connected, qr, onNotice]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(errorText(e, "Não foi possível concluir."));
      return null;
    } finally {
      setBusy(false);
    }
  }
  const connect = (number?: string) => run(async () => setQr(await inbox<{ base64: string | null; pairingCode: string | null }>("connect", number ? { number } : {})));
  const activate = () =>
    run(async () => {
      await inbox("activate");
      onNotice("Caixa de entrada ativada: as mensagens do número do suporte e do chat do site chegam aqui.");
      onChanged();
    });
  const runImport = async () => {
    let cursor = 0;
    let messages = 0;
    setProgress({ done: 0, total: 0 });
    setError("");
    try {
      for (;;) {
        const r = await inbox<{ total: number; next: number; done: boolean; messages: number }>("import", { cursor });
        messages += r.messages;
        setProgress({ done: r.next, total: r.total });
        if (r.done) break;
        cursor = r.next;
      }
      onNotice(`Histórico importado: ${messages} mensagem(ns).`);
    } catch (e) {
      setError(errorText(e, "Erro ao importar."));
    } finally {
      setProgress(null);
      onChanged();
    }
  };

  if (status.configured && status.connected && status.webhookActive && status.chats > 0 && !progress && !error) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
      <div className="flex flex-wrap items-center gap-3">
        <MessageCircle className="h-5 w-5 shrink-0 text-emerald-700" />
        <div className="min-w-0 flex-1">
          {!status.configured ? (
            "O WhatsApp do suporte ainda não está configurado no servidor (segredos da Evolution na função support-inbox)."
          ) : !status.connected ? (
            <>
              <b>Conecte o número do suporte</b> (instância {status.instance}). Abra o WhatsApp do número › Aparelhos conectados › Conectar um aparelho.
            </>
          ) : !status.webhookActive ? (
            <>
              <b>Ative a caixa de entrada</b> para as mensagens do número do suporte (e do chat do site) chegarem aqui. O seu celular continua recebendo tudo normalmente.
            </>
          ) : (
            <>
              <b>Importe o histórico</b> das conversas dos últimos 90 dias (até 40 mensagens cada).
            </>
          )}
          {status.error ? <div className="mt-1 text-xs text-red-700">{status.error}</div> : null}
          {error ? <div className="mt-1 text-xs text-red-700">{error}</div> : null}
        </div>
        {status.configured && !status.connected && !qr ? (
          <Button size="sm" disabled={busy} onClick={() => void connect()} className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Conectar por QR Code
          </Button>
        ) : null}
        {status.configured && status.connected && !status.webhookActive ? (
          <Button size="sm" disabled={busy} onClick={() => void activate()} className="bg-emerald-700 text-white hover:bg-emerald-800">
            {busy ? "Ativando…" : "Ativar caixa de entrada"}
          </Button>
        ) : null}
        {status.configured && status.connected && status.webhookActive ? (
          <Button size="sm" variant="outline" disabled={!!progress} onClick={() => void runImport()} className="gap-1.5">
            {progress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {progress.total ? `${progress.done}/${progress.total} conversas` : "Importando…"}
              </>
            ) : (
              "Importar histórico"
            )}
          </Button>
        ) : null}
      </div>

      {status.configured && !status.connected ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          {qr?.base64 ? (
            <div className="shrink-0 rounded-xl bg-white p-3 shadow-sm">
              <img src={qr.base64} alt="QR Code para conectar o WhatsApp do suporte" className="h-56 w-56" />
              <button type="button" onClick={() => void connect()} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline">
                <RefreshCw className="h-3.5 w-3.5" /> Gerar outro QR Code
              </button>
            </div>
          ) : null}
          {qr?.pairingCode ? (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Código de pareamento</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-slate-950">{qr.pairingCode}</p>
              <p className="mt-2 text-xs text-slate-500">No celular: Aparelhos conectados › Conectar com número de telefone.</p>
            </div>
          ) : null}
          <div className="text-xs text-emerald-900">
            <p className="font-medium">Prefere conectar sem câmera?</p>
            <p className="mt-0.5">Informe o número do suporte para receber um código de pareamento.</p>
            <div className="mt-2 flex gap-2">
              <input value={pairNumber} onChange={(e) => setPairNumber(e.target.value)} inputMode="tel" placeholder="(11) 99999-9999" className="w-44 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-950 outline-none focus:border-emerald-500" />
              <Button size="sm" variant="outline" disabled={busy || pairNumber.replace(/\D/g, "").length < 10} onClick={() => void connect(pairNumber)}>
                Gerar código
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DisconnectButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (!window.confirm("Desconectar o número do suporte? Esta caixa e o chat do site param até conectar de novo.")) return;
    setBusy(true);
    try {
      await inbox("logout");
    } catch (e) {
      window.alert(errorText(e, "Não foi possível desconectar."));
    } finally {
      setBusy(false);
      onDone();
    }
  }
  return (
    <button type="button" onClick={() => void logout()} disabled={busy} className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
      <LogOut className="h-3.5 w-3.5" /> Desconectar número
    </button>
  );
}

function Conversation({ chatId, onBack, onChanged }: { chatId: string; onBack: () => void; onChanged: () => void }) {
  const [data, setData] = useState<{ chat: Chat; messages: Message[] } | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setData(await inbox<{ chat: Chat; messages: Message[] }>("get", { id: chatId }));
      setError("");
    } catch (e) {
      setError(errorText(e, "Não foi possível abrir a conversa."));
    }
  }
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const chat = data?.chat;
  const messages = data?.messages ?? [];

  // Ao abrir (ou chegar mensagem nova com a conversa aberta), marca como lida.
  useEffect(() => {
    if (chat?.unread_count) void inbox("read", { id: chatId }).then(onChanged).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.unread_count, chatId]);
  useEffect(() => bottom.current?.scrollIntoView({ block: "end" }), [messages.length]);

  const refresh = () => {
    void load();
    onChanged();
  };
  async function update(patch: Record<string, unknown>) {
    try {
      await inbox("update", { id: chatId, ...patch });
      refresh();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível salvar."));
    }
  }
  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await inbox("send_text", { id: chatId, text: body });
      setText("");
      refresh();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível enviar."));
    } finally {
      setSending(false);
    }
  }
  async function sendFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      window.alert("Arquivo maior que 8 MB.");
      return;
    }
    setSending(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        r.readAsDataURL(file);
      });
      await inbox("send_media", { id: chatId, base64, mimetype: file.type || "application/octet-stream", fileName: file.name, caption: text.trim() || undefined });
      setText("");
      refresh();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível enviar o arquivo."));
    } finally {
      setSending(false);
    }
  }

  if (error && !chat) return <div className="grid place-items-center p-6 text-sm text-red-600 xl:col-span-2">{error}</div>;
  if (!chat) {
    return (
      <div className="grid place-items-center text-slate-400 xl:col-span-2">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  let lastDay = "";
  const firstName = (chat.name || "").split(/\s+/)[0] ?? "";

  return (
    <>
      <section className="flex min-h-0 flex-col">
        <header className="relative flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
          <button type="button" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onBack} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-950">{chatTitle(chat)}</div>
            <div className="truncate text-xs text-slate-500">
              {chat.phone_normalized ? `+${chat.phone_normalized}` : "Telefone oculto pelo WhatsApp"}
              {chat.academy && chat.name ? ` · ${chat.name}` : ""}
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setFollowOpen((v) => !v)}>
            <CalendarClock className="h-3.5 w-3.5" />
            {chat.follow_up_at ? `Retorno ${formatBR(chat.follow_up_at)}` : "Agendar retorno"}
          </Button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            title={chat.archived ? "Desarquivar" : "Arquivar"}
            aria-label={chat.archived ? "Desarquivar" : "Arquivar"}
            onClick={() => void update({ archived: !chat.archived })}
          >
            {chat.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          {followOpen ? (
            <div className="absolute right-3 top-12 z-20 w-64 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Lembrar de retornar em</span>
                <button type="button" onClick={() => setFollowOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input type="date" defaultValue={chat.follow_up_at ?? ""} onChange={(e) => void update({ follow_up_at: e.target.value || null })} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-950" />
              <input placeholder="Sobre o quê? (opcional)" defaultValue={chat.follow_up_note ?? ""} onBlur={(e) => void update({ follow_up_note: e.target.value || null })} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-950" />
              {chat.follow_up_at ? (
                <button type="button" className="text-xs font-medium text-blue-700 hover:underline" onClick={() => { void update({ follow_up_at: null, follow_up_note: null }); setFollowOpen(false); }}>
                  Concluir retorno
                </button>
              ) : null}
            </div>
          ) : null}
        </header>
        <div className="flex flex-wrap gap-1 border-b border-slate-200 px-3 py-1.5">
          {CHAT_TAGS.map((t) => {
            const on = chat.tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => void update({ tags: on ? chat.tags.filter((x) => x !== t) : [...chat.tags, t] })}
                className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-[#efeae2] px-3 py-3">
          {messages.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Sem mensagens guardadas nesta conversa.</p> : null}
          {messages.map((m) => {
            const day = formatBR(m.sent_at);
            const sep = day !== lastDay;
            lastDay = day;
            return (
              <div key={m.id}>
                {sep ? (
                  <div className="my-2 text-center">
                    <span className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] text-slate-500 shadow-sm">{day}</span>
                  </div>
                ) : null}
                <Bubble m={m} />
              </div>
            );
          })}
          <div ref={bottom} />
        </div>

        <footer className="flex items-end gap-2 border-t border-slate-200 bg-white p-2">
          <QuickReplies onPick={(body) => setText((t) => (t ? `${t}\n` : "") + fillName(body, firstName))} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf,video/mp4"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void sendFile(f);
            }}
          />
          <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" title="Enviar foto ou PDF (o texto vira legenda)" aria-label="Enviar arquivo" onClick={() => fileRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Mensagem · Enter envia"
            className="max-h-40 min-h-10 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500"
          />
          <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" disabled={!text.trim() || sending} onClick={() => void send()} aria-label="Enviar">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </footer>
      </section>

      <AcademyPanel chat={chat} onChanged={refresh} />
    </>
  );
}

function Bubble({ m }: { m: Message }) {
  const [media, setMedia] = useState<{ dataUrl: string; fileName: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    try {
      setMedia(await inbox<{ dataUrl: string; fileName: string | null }>("media", { message_id: m.message_id }));
    } catch (e) {
      window.alert(errorText(e, "Mídia indisponível."));
    } finally {
      setLoading(false);
    }
  }
  const isMedia = ["image", "audio", "video", "document", "sticker"].includes(m.type);
  const label =
    m.type === "image" ? "Ver foto" : m.type === "audio" ? "Ouvir áudio" : m.type === "video" ? "Ver vídeo" : m.type === "sticker" ? "Ver figurinha" : `Abrir ${m.media_name ?? "documento"}`;
  const Icon = m.type === "image" || m.type === "sticker" ? ImageIcon : m.type === "audio" ? Mic : FileText;
  return (
    <div className={`flex ${m.from_me ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-lg px-2.5 py-1.5 text-sm text-slate-900 shadow-sm ${m.from_me ? "bg-[#d9fdd3]" : "bg-white"}`}>
        {m.quoted_body ? <div className="mb-1 rounded border-l-4 border-emerald-500 bg-black/5 px-2 py-1 text-xs text-slate-600">{m.quoted_body}</div> : null}
        {isMedia ? (
          media ? (
            m.type === "image" || m.type === "sticker" ? (
              <img src={media.dataUrl} alt="" className="max-h-72 rounded" />
            ) : m.type === "audio" ? (
              <audio controls src={media.dataUrl} className="max-w-full" />
            ) : m.type === "video" ? (
              <video controls src={media.dataUrl} className="max-h-72 rounded" />
            ) : (
              <a href={media.dataUrl} download={media.fileName ?? m.media_name ?? "arquivo"} className="inline-flex items-center gap-1.5 text-emerald-800 underline">
                <Download className="h-4 w-4" /> {m.media_name ?? media.fileName ?? "Baixar documento"}
              </a>
            )
          ) : (
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 text-emerald-800 hover:underline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />} {label}
            </button>
          )
        ) : null}
        {m.body ? <div className="whitespace-pre-wrap break-words">{m.body}</div> : !isMedia ? <div className="italic text-slate-500">Mensagem não suportada</div> : null}
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
          {new Date(m.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {m.from_me ? (
            m.status === "read" ? (
              <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
            ) : m.status === "delivered" ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : m.status === "error" ? (
              <span className="font-bold text-red-600">!</span>
            ) : (
              <Check className="h-3.5 w-3.5" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickReplies({ onPick }: { onPick: (body: string) => void }) {
  const [list, setList] = useState<QuickReply[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  async function load() {
    try {
      setList(await inbox<QuickReply[]>("quick_list"));
    } catch {
      setList([]);
    }
  }
  useEffect(() => {
    if (open && list === null) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <div className="relative">
      <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" title="Respostas rápidas" aria-label="Respostas rápidas" onClick={() => setOpen((v) => !v)}>
        <Zap className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute bottom-12 left-0 z-20 w-80 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <div className="max-h-72 overflow-y-auto">
            {list === null ? <p className="p-3 text-xs text-slate-500">Carregando…</p> : null}
            {(list ?? []).map((r) => (
              <button key={r.id} type="button" onClick={() => { onPick(r.body); setOpen(false); }} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-slate-50">
                <div className="text-sm font-medium text-slate-950">{r.title}</div>
                <div className="line-clamp-2 text-xs text-slate-500">{r.body}</div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setEditing(true); setOpen(false); }} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-blue-700 hover:bg-slate-50">
            Editar respostas rápidas
          </button>
        </div>
      ) : null}
      {editing ? <QuickRepliesEditor initial={list ?? []} onClose={() => setEditing(false)} onSaved={(saved) => setList(saved)} /> : null}
    </div>
  );
}

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={title} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-950 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function QuickRepliesEditor({ initial, onClose, onSaved }: { initial: QuickReply[]; onClose: () => void; onSaved: (list: QuickReply[]) => void }) {
  const [list, setList] = useState<QuickReply[]>(initial);
  const [saving, setSaving] = useState(false);
  async function save() {
    const clean = list.filter((r) => r.title.trim() && r.body.trim());
    setSaving(true);
    try {
      await inbox("quick_save", { replies: clean });
      onSaved(clean);
      onClose();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title="Respostas rápidas" description="Use {nome} para o primeiro nome do contato." onClose={onClose}>
      <div className="space-y-3">
        {list.map((r, i) => (
          <div key={r.id} className="space-y-1.5 rounded-xl border border-slate-200 p-2">
            <div className="flex gap-2">
              <input value={r.title} placeholder="Título" onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
              <button type="button" className="rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50" onClick={() => setList(list.filter((_, j) => j !== i))}>
                Remover
              </button>
            </div>
            <textarea rows={2} value={r.body} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setList([...list, { id: crypto.randomUUID().slice(0, 8), title: "", body: "" }])}>
          <Plus className="h-4 w-4" /> Nova resposta
        </Button>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={saving} onClick={() => void save()} className="bg-black text-white hover:bg-slate-900">{saving ? "Salvando…" : "Salvar"}</Button>
      </div>
    </Modal>
  );
}

/** Ficha da academia ao lado da conversa: assinatura, alunos e chamados abertos. */
function AcademyPanel({ chat, onChanged }: { chat: Chat; onChanged: () => void }) {
  const [summary, setSummary] = useState<AcademySummary | null | undefined>(undefined);
  const [linking, setLinking] = useState(false);
  const ownerId = chat.academy_owner_id;

  useEffect(() => {
    if (!ownerId) {
      setSummary(undefined);
      return;
    }
    let active = true;
    setSummary(undefined);
    inbox<AcademySummary | null>("academy", { owner_id: ownerId })
      .then((data) => { if (active) setSummary(data); })
      .catch(() => { if (active) setSummary(null); });
    return () => { active = false; };
  }, [ownerId]);

  async function unlink() {
    try {
      await inbox("update", { id: chat.id, academy_owner_id: null });
      onChanged();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível desvincular."));
    }
  }

  return (
    <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-slate-200 p-3 xl:flex">
      {chat.is_self ? (
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-slate-950">Mensagens para si mesmo</div>
          <p className="text-xs leading-5 text-slate-500">Conversa do número do suporte com ele mesmo (anotações do WhatsApp).</p>
        </div>
      ) : !ownerId || summary === null ? (
        <div className="space-y-3 text-sm">
          <div className="font-semibold text-slate-950">{summary === null ? "Academia não encontrada" : "Contato sem academia"}</div>
          <p className="text-xs leading-5 text-slate-500">
            Vincule à academia para ver assinatura, alunos e chamados aqui. O vínculo fica guardado para as próximas mensagens.
          </p>
          <Button size="sm" className="w-full gap-1.5 bg-blue-700 text-white hover:bg-blue-800" onClick={() => setLinking(true)}>
            <Link2 className="h-4 w-4" /> Vincular academia
          </Button>
          {summary === null ? <button type="button" onClick={() => void unlink()} className="w-full text-xs text-slate-500 hover:text-slate-800">Remover vínculo</button> : null}
        </div>
      ) : summary === undefined ? (
        <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-slate-400" />
      ) : (
        <AcademySummaryCard data={summary} onUnlink={() => void unlink()} />
      )}
      {linking ? <LinkAcademyModal chat={chat} onClose={() => setLinking(false)} onDone={onChanged} /> : null}
    </aside>
  );
}

/** Ficha da academia ao lado de um chamado. */
function TicketAcademyPanel({ ownerId }: { ownerId: string | null }) {
  const [summary, setSummary] = useState<AcademySummary | null | undefined>(undefined);
  useEffect(() => {
    if (!ownerId) return;
    let active = true;
    setSummary(undefined);
    inbox<AcademySummary | null>("academy", { owner_id: ownerId })
      .then((data) => { if (active) setSummary(data); })
      .catch(() => { if (active) setSummary(null); });
    return () => { active = false; };
  }, [ownerId]);
  if (!ownerId) return <aside className="hidden border-l border-slate-200 xl:block" />;
  return (
    <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-slate-200 p-3 xl:flex">
      {summary === undefined ? (
        <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-slate-400" />
      ) : summary === null ? (
        <p className="text-sm text-slate-500">Academia não encontrada.</p>
      ) : (
        <AcademySummaryCard data={summary} />
      )}
    </aside>
  );
}

function AcademySummaryCard({ data, onUnlink }: { data: AcademySummary; onUnlink?: () => void }) {
  const group = GROUP_LABEL[data.subscription.group] ?? GROUP_LABEL.sem_assinatura;
  const deadline =
    data.subscription.group === "teste" || data.subscription.group === "teste_vencido"
      ? data.subscription.trial_ends_at ? `Teste até ${formatBR(data.subscription.trial_ends_at)}` : null
      : data.subscription.next_due_date ? `Próxima cobrança ${formatBR(data.subscription.next_due_date)}` : null;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="font-semibold text-slate-950">{data.name}</div>
        <div className="text-xs text-slate-500">{[data.owner_name, data.email, data.city].filter(Boolean).join(" · ")}</div>
        <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${group.className}`}>{group.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-slate-500">Mensalidade</div>
          <div className="font-semibold text-slate-950">{data.subscription.amount_monthly !== null ? brl.format(data.subscription.amount_monthly) : "—"}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-slate-500">Alunos ativos</div>
          <div className="font-semibold text-slate-950">{data.active_students} <span className="font-normal text-slate-500">/ {data.students}</span></div>
        </div>
      </div>
      {deadline ? <p className="text-xs text-slate-500">{deadline}</p> : null}

      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase text-slate-500">Chamados abertos</div>
        {data.open_tickets.length === 0 ? <p className="text-xs text-slate-500">Nenhum.</p> : null}
        {data.open_tickets.map((t) => (
          <div key={t.id} className="rounded-lg border border-slate-200 p-2 text-xs">
            <div className="font-medium text-slate-950">{t.subject}</div>
            <div className="text-slate-500">#{t.code} · {t.status.replace("_", " ")} · {formatBR(t.last_message_at)}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        <a href={`${DOJO_SUPPORT_URL}/dojo`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
          Abrir Dojo Manager <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {onUnlink ? <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={onUnlink}>Desvincular academia</button> : null}
      </div>
    </div>
  );
}

function LinkAcademyModal({ chat, onClose, onDone }: { chat: Chat; onClose: () => void; onDone: () => void }) {
  const [list, setList] = useState<AcademyOption[] | null>(null);
  const [q, setQ] = useState(chat.name ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    inbox<AcademyOption[]>("academies").then(setList).catch(() => setList([]));
  }, []);
  const term = q.trim().toLowerCase();
  const options = (list ?? []).filter((a) => !term || [a.name, a.email, a.phone, a.city].some((v) => v?.toLowerCase().includes(term))).slice(0, 30);
  async function link(ownerId: string) {
    setSaving(true);
    try {
      await inbox("update", { id: chat.id, academy_owner_id: ownerId });
      onDone();
      onClose();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível vincular."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title="Vincular academia" description="Escolha a academia deste contato." onClose={onClose}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, e-mail, telefone ou cidade" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
      <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {list === null ? <p className="p-3 text-sm text-slate-500">Carregando…</p> : null}
        {options.map((a) => (
          <button key={a.owner_id} type="button" disabled={saving} onClick={() => void link(a.owner_id)} className="block w-full p-2.5 text-left text-sm hover:bg-slate-50">
            <div className="font-medium text-slate-950">{a.name}</div>
            <div className="text-xs text-slate-500">{[a.email, a.phone, a.city].filter(Boolean).join(" · ")}</div>
          </button>
        ))}
        {list !== null && options.length === 0 ? <p className="p-3 text-sm text-slate-500">Nenhuma academia encontrada.</p> : null}
      </div>
    </Modal>
  );
}
