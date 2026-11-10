import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, CircleDashed, Database, Globe, MessageCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { duration, loadMonitor, runMonitorNow, timeAgo, type MonitorData, type MonitorTarget } from "@/lib/admin/monitor";

// Monitor automático: situação de cada site/serviço, disponibilidade (24 h e 7 dias), linha do tempo das últimas
// 24 h e incidentes. As verificações rodam sozinhas a cada 5 min; alertas chegam pelo sininho do cabeçalho.

const REFRESH_MS = 60000;

const kindIcon = { http: Globe, evolution: MessageCircle, supabase: Database } as const;
const kindLabel = { http: "Site", evolution: "WhatsApp (Evolution)", supabase: "API do banco" } as const;

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function StatusPill({ status }: { status: MonitorTarget["status"] }) {
  if (status === "up") return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> No ar</span>;
  if (status === "down") return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"><CircleAlert className="h-3.5 w-3.5" /> Fora do ar</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"><CircleDashed className="h-3.5 w-3.5" /> Aguardando</span>;
}

/** 24 barras, uma por hora (a mais recente à direita). */
function Timeline({ hours }: { hours: Map<number, { total: number; failures: number }> }) {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const slots = Array.from({ length: 24 }, (_, i) => now.getTime() - (23 - i) * 3600000);
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-label="Últimas 24 horas">
      {slots.map((slot) => {
        const h = hours.get(slot);
        const color = !h ? "bg-slate-200" : h.failures === 0 ? "bg-emerald-500" : h.failures >= h.total ? "bg-red-500" : "bg-amber-400";
        const label = !h
          ? "Sem verificações"
          : h.failures === 0
            ? `${h.total} verificações, todas ok`
            : `${h.failures} de ${h.total} verificações falharam`;
        return <span key={slot} title={`${new Date(slot).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · ${label}`} className={`h-full flex-1 rounded-[3px] ${color}`} />;
      })}
    </div>
  );
}

export function MonitorWorkspace() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setData(await loadMonitor());
    } catch (error) {
      setMessage((error as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function checkNow() {
    setRunning(true);
    setMessage("");
    try {
      await runMonitorNow();
      await refresh();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const byTarget = useMemo(() => {
    const uptime = new Map((data?.uptime ?? []).map((u) => [u.target_id, u]));
    const hours = new Map<string, Map<number, { total: number; failures: number }>>();
    for (const h of data?.timeline ?? []) {
      const map = hours.get(h.target_id) ?? new Map();
      map.set(new Date(h.hour).getTime(), { total: Number(h.total), failures: Number(h.failures) });
      hours.set(h.target_id, map);
    }
    return { uptime, hours };
  }, [data]);

  const targets = data?.targets ?? [];
  const names = new Map(targets.map((t) => [t.id, t.name]));
  const down = targets.filter((t) => t.status === "down");
  const known = targets.some((t) => t.status !== "unknown");
  const lastCheck = targets.map((t) => t.last_checked_at).filter(Boolean).sort().at(-1) ?? null;
  const uptimes = (data?.uptime ?? []).map((u) => u.uptime_24h).filter((v): v is number => v !== null);
  const overall = uptimes.length ? uptimes.reduce((a, b) => a + Number(b), 0) / uptimes.length : null;
  const openIncidents = (data?.incidents ?? []).filter((i) => !i.resolved_at).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Monitor</h2>
          <p className="mt-1 text-sm text-slate-500">Sites, WhatsApp do suporte e bancos verificados a cada 5 minutos. Se algo cair, o alerta chega pelo sininho.</p>
        </div>
        <Button type="button" onClick={() => void checkNow()} disabled={running} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} /> {running ? "Verificando..." : "Verificar agora"}
        </Button>
      </div>

      {message && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

      <div className={`rounded-xl border p-5 ${!known ? "border-slate-200 bg-slate-50" : down.length ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
        <p className={`text-base font-semibold ${!known ? "text-slate-700" : down.length ? "text-red-800" : "text-emerald-800"}`}>
          {!data ? "Carregando..." : !known ? "Aguardando a primeira verificação" : down.length ? `${down.length} ${down.length === 1 ? "item fora do ar" : "itens fora do ar"}: ${down.map((t) => t.name).join(", ")}` : "Tudo funcionando"}
        </p>
        <p className="mt-1 text-sm text-slate-600">Última verificação {timeAgo(lastCheck)}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Itens monitorados</p><p className="mt-2 text-2xl font-semibold text-slate-950">{targets.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Disponibilidade média (24 h)</p><p className="mt-2 text-2xl font-semibold text-slate-950">{pct(overall)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Incidentes em aberto</p><p className={`mt-2 text-2xl font-semibold ${openIncidents ? "text-red-700" : "text-slate-950"}`}>{openIncidents}</p></div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.5fr_1.2fr_90px_90px_90px] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-950 lg:grid">
          <span>Item</span><span>Últimas 24 h</span><span>24 h</span><span>7 dias</span><span>Resposta</span>
        </div>
        {!data ? <div className="p-10 text-center text-sm text-slate-500">Carregando monitor...</div> : targets.map((t) => {
          const Icon = kindIcon[t.kind];
          const u = byTarget.uptime.get(t.id);
          return (
            <div key={t.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 lg:grid-cols-[1.5fr_1.2fr_90px_90px_90px] lg:items-center lg:gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-950">{t.name}</p><StatusPill status={t.status} /></div>
                  <p className="mt-1 truncate text-xs text-slate-500">{kindLabel[t.kind]} · {t.kind === "evolution" ? `instância ${t.url}` : t.url.replace(/^https?:\/\//, "")}</p>
                  {t.last_error ? <p className="mt-1 text-xs text-red-600">{t.last_error}{t.consecutive_failures > 1 ? ` · ${t.consecutive_failures} falhas seguidas` : ""}</p> : null}
                  {t.status === "down" && t.last_change_at ? <p className="mt-0.5 text-xs text-red-600">Fora do ar há {duration(t.last_change_at, null)}</p> : null}
                </div>
              </div>
              <Timeline hours={byTarget.hours.get(t.id) ?? new Map()} />
              <p className="text-sm text-slate-700"><span className="text-xs text-slate-500 lg:hidden">24 h: </span>{pct(u?.uptime_24h)}</p>
              <p className="text-sm text-slate-700"><span className="text-xs text-slate-500 lg:hidden">7 dias: </span>{pct(u?.uptime_7d)}</p>
              <p className="text-sm text-slate-700"><span className="text-xs text-slate-500 lg:hidden">Resposta: </span>{u?.avg_ms_24h ? `${u.avg_ms_24h} ms` : t.last_response_ms ? `${t.last_response_ms} ms` : "—"}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Incidentes recentes</h3>
        {!data?.incidents.length ? (
          <p className="mt-3 text-sm text-slate-500">Nenhuma queda registrada.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {data.incidents.map((i) => (
              <li key={i.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-950">{names.get(i.target_id) ?? i.target_id}</p>
                  <p className="text-xs text-slate-500">{i.error ?? "Falha nas verificações"}</p>
                </div>
                <div className="text-xs sm:text-right">
                  <p className={i.resolved_at ? "text-slate-600" : "font-medium text-red-700"}>{i.resolved_at ? `Resolvido · durou ${duration(i.started_at, i.resolved_at)}` : `Em aberto há ${duration(i.started_at, null)}`}</p>
                  <p className="text-slate-400">{new Date(i.started_at).toLocaleString("pt-BR")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
