import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Clock, Loader2, MessageCircleMore, OctagonX, Play, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { inbox } from "@/lib/support-inbox";

// Follow-up do teste grátis (função support-inbox, followup.ts): mensagens nos dias 1, 3 e 7 depois do fim do
// teste para quem não assinou o Dojo Manager. Aqui o dono liga/desliga, vê a fila e libera +7 dias.

type Item = {
  owner_id: string;
  academy: string | null;
  first_name: string | null;
  phone: string | null;
  plan_code: string | null;
  status: string;
  trial_ends_at: string | null;
  in_trial: boolean;
  cycle: number;
  chat_id: string | null;
  steps: { step: number; status: string; sent_at: string }[];
  stopped: { reason: string; label: string; at: string | null } | null;
  next: { step: number; day: string } | null;
  can_extend: boolean;
};

type Overview = {
  settings: { enabled: boolean };
  business_hours: boolean;
  schedule: number[];
  preview: { step: number; day: number; text: string }[];
  items: Item[];
};

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
const brDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");
const brCalendar = (day: string) => day.split("-").reverse().join("/");
const prettyPhone = (d: string | null) => {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(d ?? "");
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : d ? `+${d}` : "sem WhatsApp";
};

export function TrialFollowupButton({ onOpenChat }: { onOpenChat?: (chatId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    // Só para o selo do botão (pedidos de +7 dias aguardando).
    void inbox<Overview>("followup_overview").then(setData).catch(() => setData(null));
  }, [open]);
  const enabled = data?.settings.enabled ?? false;
  const waiting = (data?.items ?? []).filter((i) => i.stopped?.reason === "extension_requested").length;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Mensagens para quem fez o teste grátis e não assinou"
        className={`relative inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        <MessageCircleMore className="h-4 w-4" />
        Follow-up do teste
        <span className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
        {waiting > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">{waiting}</span>
        ) : null}
      </button>
      <TrialFollowupSheet open={open} onOpenChange={setOpen} onOpenChat={onOpenChat} onData={setData} />
    </>
  );
}

function TrialFollowupSheet({
  open, onOpenChange, onOpenChat, onData,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenChat?: (chatId: string) => void;
  onData: (d: Overview) => void;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await inbox<Overview>("followup_overview");
      setData(d);
      onData(d);
    } catch (e) {
      setError(errorText(e, "Não foi possível carregar o follow-up."));
    }
  }, [onData]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function act(key: string, action: string, body: Record<string, unknown>, question?: string, done?: (r: any) => string) {
    if (question && !window.confirm(question)) return;
    setBusy(key);
    setNotice(null);
    try {
      const r = await inbox<any>(action, body);
      if (done) setNotice(done(r));
      await load();
    } catch (e) {
      window.alert(errorText(e, "Não foi possível concluir."));
    } finally {
      setBusy(null);
    }
  }

  const enabled = data?.settings.enabled ?? false;
  const waiting = (data?.items ?? []).filter((i) => i.stopped?.reason === "extension_requested");
  const others = (data?.items ?? []).filter((i) => i.stopped?.reason !== "extension_requested");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-slate-200 bg-slate-50 text-slate-900 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-slate-950">Follow-up do teste grátis</SheetTitle>
          <SheetDescription className="text-slate-600">
            Para quem testou o AMT Dojo Manager e não assinou: mensagens nos dias {(data?.schedule ?? [1, 3, 7]).join(", ")} depois do fim do
            teste, pelo número do suporte, de segunda a sábado das 9h às 19h. Para sozinho quando o cliente assina ou responde.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!data || busy !== null}
              onClick={() =>
                void act(
                  "toggle",
                  "followup_settings_save",
                  { enabled: !enabled },
                  enabled
                    ? undefined
                    : "Ligar o follow-up do teste grátis?\n\nAs mensagens passam a sair sozinhas pelo número do suporte para quem terminou o teste e não assinou (dias 1, 3 e 7), em horário comercial.",
                )
              }
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium disabled:opacity-60 ${enabled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </span>
              {enabled ? "Ligado" : "Desligado"}
            </button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              disabled={!enabled || busy !== null}
              title={data?.business_hours ? "Envia agora o que já está na vez" : "Fora do horário comercial: nada é enviado agora"}
              onClick={() =>
                void act("run", "followup_run", {}, undefined, (r) =>
                  r?.skipped ? `Nada enviado: ${r.skipped}.` : `${r?.sent ?? 0} mensagem(ns) enviada(s)${r?.failed ? `, ${r.failed} falha(s)` : ""}.`,
                )
              }
            >
              {busy === "run" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
              Verificar agora
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-9 text-slate-700 hover:bg-slate-100" onClick={() => void load()} disabled={busy !== null}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Atualizar
            </Button>
          </div>

          {notice ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{notice}</p> : null}
          {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {!data && !error ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </p>
          ) : null}

          {waiting.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pediram mais 7 dias</h3>
              {waiting.map((it) => (
                <Row key={it.owner_id} it={it} busy={busy} act={act} onOpenChat={onOpenChat} highlight />
              ))}
            </section>
          ) : null}

          {data ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Academias ({others.length})</h3>
              {others.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                  Nenhum teste grátis terminado nos últimos 60 dias.
                </p>
              ) : (
                others.map((it) => <Row key={it.owner_id} it={it} busy={busy} act={act} onOpenChat={onOpenChat} />)
              )}
            </section>
          ) : null}

          {data ? (
            <details className="rounded-lg border border-slate-200 bg-white">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">Ver as mensagens</summary>
              <div className="space-y-3 border-t border-slate-200 p-3">
                {data.preview.map((p) => (
                  <div key={p.step}>
                    <div className="mb-1 text-xs font-semibold text-slate-500">
                      Mensagem {p.step} · dia {p.day}
                    </div>
                    <pre className="whitespace-pre-wrap rounded-lg bg-[#e7ffdb] p-3 font-sans text-[13px] leading-snug text-slate-800">{p.text}</pre>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Depois de liberados os 7 dias, se o cliente ainda não assinar, a sequência recomeça sem a oferta de prorrogação.
                </p>
              </div>
            </details>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  it, busy, act, onOpenChat, highlight,
}: {
  it: Item;
  busy: string | null;
  act: (key: string, action: string, body: Record<string, unknown>, question?: string, done?: (r: any) => string) => Promise<void>;
  onOpenChat?: (chatId: string) => void;
  highlight?: boolean;
}) {
  const name = it.academy || "Academia sem nome";
  const sent = it.steps.filter((s) => s.status === "sent");
  const failed = it.steps.find((s) => s.status === "failed");
  let situation: { text: string; tone: string; icon: typeof Clock };
  if (it.status === "active") situation = { text: "Assinou", tone: "text-emerald-700", icon: CheckCircle2 };
  else if (it.stopped) situation = { text: it.stopped.label, tone: it.stopped.reason === "extension_requested" ? "text-amber-700" : "text-slate-600", icon: OctagonX };
  else if (it.in_trial) situation = { text: `Em teste até ${brDay(it.trial_ends_at)}`, tone: "text-sky-700", icon: Clock };
  else if (it.next) situation = { text: `Mensagem ${it.next.step} em ${brCalendar(it.next.day)}`, tone: "text-slate-700", icon: Send };
  else situation = { text: sent.length >= 3 ? "Sequência concluída" : "Aguardando", tone: "text-slate-600", icon: CheckCircle2 };
  const Icon = situation.icon;
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">
            {it.first_name ? `${it.first_name} · ` : ""}
            {prettyPhone(it.phone)} · teste até {brDay(it.trial_ends_at)}
            {it.cycle > 1 ? ` · ${it.cycle}º ciclo` : ""}
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${situation.tone}`}>
          <Icon className="h-3.5 w-3.5" /> {situation.text}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {[1, 2, 3].map((n) => {
          const s = it.steps.find((x) => x.step === n);
          const cls = s?.status === "sent"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : s?.status === "failed"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-slate-50 text-slate-400";
          return (
            <span key={n} title={s ? `${s.status === "sent" ? "Enviada" : "Falhou"} em ${brDay(s.sent_at)}` : "Ainda não enviada"} className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
              {n} {s?.status === "sent" ? `· ${brDay(s.sent_at).slice(0, 5)}` : s?.status === "failed" ? "· falhou" : ""}
            </span>
          );
        })}
        {failed ? <span className="text-[11px] text-red-600">Tentará de novo na próxima hora.</span> : null}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {it.chat_id && onOpenChat ? (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100" onClick={() => onOpenChat(it.chat_id!)}>
              Conversa
            </Button>
          ) : null}
          {it.can_extend ? (
            <Button
              size="sm"
              variant="outline"
              className={`h-7 px-2 text-xs ${highlight ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:text-white" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"}`}
              disabled={busy !== null}
              onClick={() =>
                void act(
                  `ext:${it.owner_id}`,
                  "followup_extend",
                  { owner_id: it.owner_id },
                  `Liberar mais 7 dias de teste para ${name}?\n\nO acesso volta na hora e o cliente recebe um aviso no WhatsApp.`,
                  (r) => `Teste de ${name} liberado até ${brDay(r?.trial_ends_at ?? null)}${r?.notified ? " · cliente avisado no WhatsApp" : ""}.`,
                )
              }
            >
              {busy === `ext:${it.owner_id}` ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CalendarPlus className="mr-1 h-3.5 w-3.5" />}
              +7 dias
            </Button>
          ) : null}
          {it.status !== "active" && !it.in_trial ? (
            it.stopped && !["subscribed", "extension_requested"].includes(it.stopped.reason) ? (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100" disabled={busy !== null} onClick={() => void act(`res:${it.owner_id}`, "followup_resume", { owner_id: it.owner_id }, `Retomar o follow-up de ${name}?`)}>
                Retomar
              </Button>
            ) : !it.stopped ? (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-700 hover:bg-red-50" disabled={busy !== null} onClick={() => void act(`stop:${it.owner_id}`, "followup_stop", { owner_id: it.owner_id }, `Parar o follow-up de ${name}?`)}>
                Parar
              </Button>
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}
