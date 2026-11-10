import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registrarLeadDoChat } from "@/lib/site-chat-lead.functions";
import { siteChat } from "@/lib/support-inbox";
import { cn } from "@/lib/utils";
import { SITE_CHAT_EVENT, SUPPORT_WHATSAPP_URL } from "./site-config";

// Chat do site ligado ao WhatsApp do suporte (551151040791, instância amt-suporte).
// O visitante informa nome, WhatsApp e mensagem; o suporte recebe no celular e no /admin e responde por
// qualquer um dos dois. A janela mostra a conversa ao vivo e as respostas também chegam no WhatsApp do visitante.

type ChatMessage = {
  id: string;
  from_me: boolean;
  type: string;
  body: string | null;
  sent_at: string;
};

const STORAGE_KEY = "amt-site-chat";
const POLL_OPEN_MS = 4000;
const POLL_CLOSED_MS = 30000;

function readStored(): { token: string; seen: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { token: string; seen: string }) : null;
  } catch {
    return null;
  }
}
function writeStored(value: { token: string; seen: string } | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sem armazenamento (aba anônima, bloqueio): a conversa vale só enquanto a página estiver aberta
  }
}

const label = (m: ChatMessage) =>
  m.body ??
  (
    {
      image: "📷 Foto",
      audio: "🎤 Áudio",
      video: "🎬 Vídeo",
      document: "📄 Documento",
      sticker: "Figurinha",
    } as Record<string, string>
  )[m.type] ??
  "Mensagem";

export function SiteChat() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [seen, setSeen] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", message: "", website: "" });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  // Retoma a conversa guardada e escuta os botões "WhatsApp" do site.
  useEffect(() => {
    const stored = readStored();
    if (stored?.token) {
      setToken(stored.token);
      setSeen(stored.seen ?? "");
    }
    const openChat = () => setOpen(true);
    window.addEventListener(SITE_CHAT_EVENT, openChat);
    (window as unknown as { __amtSiteChat?: boolean }).__amtSiteChat = true;
    return () => {
      window.removeEventListener(SITE_CHAT_EVENT, openChat);
      (window as unknown as { __amtSiteChat?: boolean }).__amtSiteChat = false;
    };
  }, []);

  // Acompanha a conversa: rápido com a janela aberta, devagar fechada (para o aviso de resposta nova).
  useEffect(() => {
    if (!token) return;
    let active = true;
    const poll = async () => {
      try {
        const r = await siteChat<{ messages: ChatMessage[] }>("site_poll", { token });
        if (active) setMessages(r.messages);
      } catch (e) {
        if (active && e instanceof Error && /expirada/i.test(e.message)) {
          writeStored(null);
          setToken(null);
          setMessages([]);
        }
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token, open]);

  const lastReply = [...messages].reverse().find((m) => m.from_me)?.sent_at ?? "";
  const hasNew = !open && !!lastReply && lastReply > seen;

  useEffect(() => {
    if (!open || !token) return;
    bottom.current?.scrollIntoView({ block: "end" });
    if (lastReply && lastReply > seen) {
      setSeen(lastReply);
      writeStored({ token, seen: lastReply });
    }
  }, [open, token, messages.length, lastReply, seen]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await siteChat<{ token: string; messages: ChatMessage[] }>("site_start", form);
      setToken(r.token);
      setMessages(r.messages);
      writeStored({ token: r.token, seen: "" });
      // O visitante também entra no funil de leads do /admin (não atrasa nem bloqueia o chat).
      void registrarLeadDoChat({
        data: { token: r.token, name: form.name, phone: form.phone, message: form.message },
      }).catch(() => undefined);
      setForm({ name: "", phone: "", message: "", website: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a conversa.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const body = text.trim();
    if (!body || busy || !token) return;
    setBusy(true);
    setError("");
    try {
      const r = await siteChat<{ messages: ChatMessage[] }>("site_send", { token, text: body });
      setMessages(r.messages);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    writeStored(null);
    setToken(null);
    setMessages([]);
    setError("");
  }

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="Conversa com a AMT Sistemas"
          className="fixed inset-x-3 bottom-3 z-[70] flex max-h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-lift)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <header
            className="flex items-center gap-3 px-4 py-3.5 text-white"
            style={{ background: "var(--gradient-dark)" }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <img src="/brand/amt-simbolo.png" alt="" className="w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold leading-tight">AMT Sistemas</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Atendimento pelo
                WhatsApp
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Fechar conversa"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {!token ? (
            <form onSubmit={start} className="space-y-3 overflow-y-auto p-4">
              <div className="rounded-xl bg-[var(--section-alt)] px-3.5 py-3 text-sm leading-6 text-[var(--brand-navy)]">
                Olá! 👋 Conte o que você precisa. Respondemos <b>aqui e no seu WhatsApp</b>.
              </div>
              <Input
                required
                maxLength={80}
                autoComplete="name"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11"
              />
              <Input
                required
                inputMode="tel"
                maxLength={30}
                autoComplete="tel"
                placeholder="Seu WhatsApp com DDD"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-11"
              />
              <textarea
                required
                rows={3}
                maxLength={1000}
                placeholder="Sua mensagem"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-md border border-[var(--input)] bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--ring)]"
              />
              {/* Campo-isca: invisível para pessoas; robôs costumam preencher. */}
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
              {error ? (
                <p className="text-xs text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={busy}
                className="h-11 w-full rounded-xl font-semibold"
              >
                {busy ? <Loader2 className="animate-spin" /> : null} Iniciar conversa <ArrowRight />
              </Button>
              <p className="text-center text-[11px] leading-4 text-muted-foreground">
                Usamos seus dados só para responder.{" "}
                <a href="/privacidade" className="underline underline-offset-2">
                  Privacidade
                </a>
              </p>
            </form>
          ) : (
            <>
              <div className="min-h-[260px] flex-1 space-y-2 overflow-y-auto bg-[var(--section-alt)] px-3 py-3">
                {messages.map((m) => {
                  const visitor = !m.from_me;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", visitor ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          visitor
                            ? "rounded-br-md bg-[var(--brand-navy)] text-white"
                            : "rounded-bl-md bg-white text-foreground",
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">{label(m)}</div>
                        <div
                          className={cn(
                            "mt-0.5 text-right text-[10px]",
                            visitor ? "text-white/60" : "text-muted-foreground",
                          )}
                        >
                          {new Date(m.sent_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              <div className="border-t border-[var(--border)] bg-white p-3">
                {error ? (
                  <p className="mb-2 text-xs text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    maxLength={1000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Escreva sua mensagem"
                    aria-label="Mensagem"
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-[var(--input)] bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!text.trim() || busy}
                    aria-label="Enviar"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-navy)] text-white disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--brand-teal)] hover:underline"
                  >
                    Continuar no WhatsApp
                  </a>
                  <button type="button" onClick={restart} className="hover:text-foreground">
                    Nova conversa
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[60] inline-flex h-14 items-center gap-2 rounded-full bg-[#1FAF5A] pl-4 pr-5 text-sm font-semibold text-white shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5 sm:bottom-5 sm:right-5"
          aria-label={hasNew ? "Abrir conversa (resposta nova)" : "Falar com a AMT pelo WhatsApp"}
        >
          <span className="relative">
            <MessageCircle className="h-6 w-6" />
            {hasNew ? (
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#1FAF5A] bg-red-500" />
            ) : null}
          </span>
          <span className="hidden sm:inline">{hasNew ? "Resposta nova" : "Fale conosco"}</span>
        </button>
      ) : null}
    </>
  );
}
