import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, X } from "lucide-react";

import { alertsState, disableAlerts, enableAlerts, sendTestAlert, type AlertsState } from "@/lib/admin/alerts";

// Sino do cabeçalho do Control Center: liga, testa e desliga os alertas de atendimento neste aparelho.

const STATE_TEXT: Record<AlertsState, string> = {
  on: "Este aparelho recebe alertas de WhatsApp, chamados e leads novos, mesmo com o /admin fechado.",
  off: "Ative para receber alertas de WhatsApp, chamados e leads novos neste aparelho.",
  blocked: "As notificações estão bloqueadas neste navegador. Libere nas configurações do site (cadeado na barra de endereço) e tente de novo.",
  "ios-install": "No iPhone: toque em Compartilhar › Adicionar à Tela de Início, abra o Control Center pelo ícone e ative por lá.",
  unsupported: "Este navegador não recebe alertas. Use o Chrome, o Edge ou o Firefox (no iPhone, o app pela Tela de Início).",
};

export function AdminAlerts() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AlertsState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void alertsState().then(setState).catch(() => setState("unsupported"));
  }, []);

  async function run(fn: () => Promise<void>, done: string) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(done);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setState(await alertsState().catch(() => "unsupported" as const));
      setBusy(false);
    }
  }

  const Icon = state === "on" ? BellRing : state === "off" ? Bell : BellOff;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        aria-label="Alertas de atendimento"
        title="Alertas de atendimento"
      >
        <Icon className="h-4 w-4" />
        {state === "off" ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" /> : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-950">Alertas de atendimento</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">{state ? STATE_TEXT[state] : "Verificando este aparelho…"}</p>
          {message ? <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">{message}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {state === "off" || state === "blocked" ? (
              <button type="button" disabled={busy} onClick={() => void run(enableAlerts, "Alertas ativados neste aparelho.")} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-60">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />} Ativar neste aparelho
              </button>
            ) : null}
            {state === "on" ? (
              <>
                <button type="button" disabled={busy} onClick={() => void run(sendTestAlert, "Teste enviado: deve chegar em alguns segundos.")} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-60">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />} Enviar teste
                </button>
                <button type="button" disabled={busy} onClick={() => void run(disableAlerts, "Alertas desligados neste aparelho.")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Desativar
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
