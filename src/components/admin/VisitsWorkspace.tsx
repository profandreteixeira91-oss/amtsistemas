import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/admin/monitor";
import {
  DEVICE_LABEL,
  change,
  countryName,
  fillSeries,
  formatNumber,
  loadRecentVisits,
  loadVisitsReport,
  pageName,
  type ChartBucket,
  type RecentVisit,
  type VisitRow,
  type VisitsReport,
} from "@/lib/admin/visits";

// Visitas do site: quantas pessoas viram amtsistemas.com.br no período, de onde vieram, o que leram e em que
// aparelho. Contagem própria, sem cookies nem IP (src/components/site/VisitTracker.tsx).

const PERIODS = [
  { days: 1, label: "Hoje", previous: "ontem" },
  { days: 7, label: "7 dias", previous: "os 7 dias anteriores" },
  { days: 30, label: "30 dias", previous: "os 30 dias anteriores" },
  { days: 90, label: "90 dias", previous: "os 90 dias anteriores" },
] as const;

const REFRESH_MS = 60000;
const PERIOD_KEY = "amt-admin-visitas-periodo";

function Delta({ value, against }: { value: number | null; against: string }) {
  if (value === null)
    return <p className="mt-1 text-xs text-slate-400">Sem base para comparar com {against}</p>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value > 0 ? "text-emerald-700" : value < 0 ? "text-red-700" : "text-slate-500";
  return (
    <p className={`mt-1 inline-flex items-center gap-1 text-xs ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}
      {value}% <span className="text-slate-500">vs. {against}</span>
    </p>
  );
}

function Kpi({
  label,
  value,
  hint,
  delta,
  against,
}: {
  label: string;
  value: string;
  hint: string;
  delta: number | null;
  against: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" title={hint}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
      {value !== "—" && <Delta value={delta} against={against} />}
    </div>
  );
}

/** Colunas por dia (ou por hora em "Hoje"): uma série só, visualizações, com os visitantes no tooltip. */
function VisitsChart({ buckets }: { buckets: ChartBucket[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const max = Math.max(1, ...buckets.map((b) => b.views));
  const step =
    max <= 4
      ? 1
      : Math.ceil(max / 4 / Math.pow(10, Math.floor(Math.log10(max / 4)))) *
        Math.pow(10, Math.floor(Math.log10(max / 4)));
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);
  // Um rótulo do eixo a cada ~60 px, para as datas não se sobreporem no celular.
  const labelEvery = Math.max(
    1,
    Math.ceil(buckets.length / Math.max(2, Math.floor((width - 40) / 60))),
  );
  const active = hover === null ? null : buckets[hover];

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex h-56 gap-2">
        <div className="relative w-8 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0"
              style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}
            >
              {formatNumber(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {ticks.map((t) => (
            <span
              key={t}
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-slate-300" : "border-dashed border-slate-100"}`}
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          <div
            className="absolute inset-0 flex items-end gap-[2px]"
            onMouseLeave={() => setHover(null)}
          >
            {buckets.map((b, i) => (
              <button
                key={b.key}
                type="button"
                aria-label={`${b.tooltip}: ${b.views} visualizações, ${b.visitors} visitantes`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-colors ${b.views === 0 ? "" : hover === i ? "bg-blue-700" : "bg-blue-600"} group-focus-visible:ring-2 group-focus-visible:ring-blue-300`}
                  style={{ height: b.views === 0 ? 0 : `max(3px, ${(b.views / top) * 100}%)` }}
                />
              </button>
            ))}
          </div>
          {active && hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
              style={{
                left: `${((hover + 0.5) / buckets.length) * 100}%`,
                transform: `translate(${hover < buckets.length / 4 ? "-10%" : hover > (buckets.length * 3) / 4 ? "-90%" : "-50%"}, -100%)`,
              }}
            >
              <p className="font-medium capitalize text-slate-950">{active.tooltip}</p>
              <p className="mt-1 tabular-nums text-slate-700">
                {formatNumber(active.views)} visualizações
              </p>
              <p className="tabular-nums text-slate-500">
                {formatNumber(active.visitors)} visitantes
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-10 mt-2 flex gap-[2px] text-[11px] text-slate-400">
        {buckets.map((b, i) => (
          <span
            key={b.key}
            className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center"
          >
            {i % labelEvery === 0 ? b.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Lista com barra proporcional atrás de cada linha. */
function RankedList({
  title,
  subtitle,
  rows,
  metric,
  metricLabel,
  format = (label) => label,
  empty = "Nenhuma visita no período.",
}: {
  title: string;
  subtitle?: string;
  rows: VisitRow[];
  metric: "views" | "visitors";
  metricLabel: string;
  format?: (label: string) => string;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r[metric]));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span className="text-xs text-slate-400">{metricLabel}</span>
      </div>
      {!rows.length ? (
        <p className="mt-4 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {rows.map((r) => {
            const name = format(r.label);
            return (
              <li
                key={r.label}
                className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-1.5 text-sm"
                title={`${name}: ${formatNumber(r.views)} visualizações · ${formatNumber(r.visitors)} visitantes`}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-md bg-blue-50"
                  style={{ width: `${(r[metric] / max) * 100}%` }}
                />
                <span className="relative min-w-0 truncate text-slate-800">{name}</span>
                <span className="relative shrink-0 font-medium tabular-nums text-slate-950">
                  {formatNumber(r[metric])}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function originOf(v: RecentVisit): string {
  if (!v.entry) return "Navegando no site";
  if (v.utm_source) return v.utm_source;
  return v.referrer_host ?? "Direto";
}

export function VisitsWorkspace() {
  const [days, setDays] = useState<number>(7);
  const [report, setReport] = useState<VisitsReport | null>(null);
  const [recent, setRecent] = useState<RecentVisit[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(PERIOD_KEY));
      if (PERIODS.some((p) => p.days === saved)) setDays(saved);
    } catch {
      // sem armazenamento: 7 dias
    }
  }, []);

  const refresh = useCallback(async (period: number) => {
    setLoading(true);
    try {
      const [r, list] = await Promise.all([loadVisitsReport(period), loadRecentVisits()]);
      setReport(r);
      setRecent(list);
      setMessage("");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(days);
    const timer = window.setInterval(() => void refresh(days), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [days, refresh]);

  function choose(period: number) {
    setDays(period);
    try {
      localStorage.setItem(PERIOD_KEY, String(period));
    } catch {
      // só nesta visita
    }
  }

  const period = PERIODS.find((p) => p.days === days) ?? PERIODS[1];
  const current = report?.days === days ? report : null;
  const buckets = useMemo(() => (current ? fillSeries(current) : []), [current]);
  const t = current?.totals;
  const p = current?.previous;
  const pagesPerVisitor = t && t.visitors ? t.views / t.visitors : 0;
  const prevPagesPerVisitor = p && p.visitors ? p.views / p.visitors : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Visitas do site</h2>
          <p className="mt-1 text-sm text-slate-500">
            Páginas públicas de amtsistemas.com.br. Atualiza sozinho a cada minuto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            title="Visitantes com página aberta nos últimos 5 minutos"
          >
            <span className="relative flex h-2 w-2">
              {report?.online ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              ) : null}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {report
              ? `${report.online} ${report.online === 1 ? "pessoa" : "pessoas"} no site agora`
              : "No site agora"}
          </span>
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            role="group"
            aria-label="Período"
          >
            {PERIODS.map((item) => (
              <button
                key={item.days}
                type="button"
                onClick={() => choose(item.days)}
                aria-pressed={days === item.days}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${days === item.days ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh(days)}
            disabled={loading}
            className="gap-2"
            title="Atualizar agora"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only sm:not-sr-only">Atualizar</span>
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Visitantes"
          value={t ? formatNumber(t.visitors) : "—"}
          hint="Pessoas diferentes; a mesma pessoa conta uma vez por dia"
          delta={t && p ? change(t.visitors, p.visitors) : null}
          against={period.previous}
        />
        <Kpi
          label="Visualizações de página"
          value={t ? formatNumber(t.views) : "—"}
          hint="Cada página aberta conta uma vez"
          delta={t && p ? change(t.views, p.views) : null}
          against={period.previous}
        />
        <Kpi
          label="Chegadas ao site"
          value={t ? formatNumber(t.entries) : "—"}
          hint="Vezes em que alguém chegou ao site vindo de fora (Google, Instagram, link direto...)"
          delta={t && p ? change(t.entries, p.entries) : null}
          against={period.previous}
        />
        <Kpi
          label="Páginas por visitante"
          value={t ? formatNumber(pagesPerVisitor, 1) : "—"}
          hint="Visualizações divididas pelos visitantes"
          delta={
            t && p && prevPagesPerVisitor
              ? change(Math.round(pagesPerVisitor * 10), Math.round(prevPagesPerVisitor * 10))
              : null
          }
          against={period.previous}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-slate-950">
            Visualizações {days === 1 ? "por hora (hoje)" : `por dia (${period.label})`}
          </h3>
          <p className="text-xs text-slate-500">Passe o mouse numa coluna para ver os visitantes</p>
        </div>
        {!current ? (
          <div className="grid h-56 place-items-center text-sm text-slate-500">Carregando...</div>
        ) : (
          <>
            <VisitsChart buckets={buckets} />
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-900">
                Ver como tabela
              </summary>
              <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">{days === 1 ? "Hora" : "Dia"}</th>
                      <th className="px-3 py-2 text-right font-medium">Visualizações</th>
                      <th className="px-3 py-2 text-right font-medium">Visitantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buckets.map((b) => (
                      <tr key={b.key} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 capitalize text-slate-700">{b.tooltip}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{b.views}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{b.visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>

      {current && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RankedList
            title="Páginas mais vistas"
            rows={current.pages}
            metric="views"
            metricLabel="Visualizações"
            format={pageName}
          />
          <RankedList
            title="De onde vieram"
            subtitle="Buscadores, redes sociais, sites e campanhas (utm_source)"
            rows={current.sources}
            metric="views"
            metricLabel="Chegadas"
          />
          <RankedList
            title="Aparelhos"
            rows={current.devices}
            metric="visitors"
            metricLabel="Visitantes"
            format={(l) => DEVICE_LABEL[l] ?? l}
          />
          <RankedList
            title="Campanhas"
            subtitle="Links com utm_campaign (campanha · origem · mídia)"
            rows={current.campaigns}
            metric="views"
            metricLabel="Chegadas"
            empty="Nenhum link de campanha usado no período."
          />
          <RankedList
            title="Navegadores"
            rows={current.browsers}
            metric="visitors"
            metricLabel="Visitantes"
          />
          <RankedList
            title="Sistemas"
            rows={current.systems}
            metric="visitors"
            metricLabel="Visitantes"
          />
          <RankedList
            title="Cidades"
            subtitle="Local aproximado, pela rede de quem acessa"
            rows={current.cities}
            metric="visitors"
            metricLabel="Visitantes"
          />
          <RankedList
            title="Países"
            rows={current.countries}
            metric="visitors"
            metricLabel="Visitantes"
            format={countryName}
          />
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-950">Últimas páginas vistas</h3>
        </div>
        {!recent.length ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            {report ? "Nenhuma visita registrada ainda." : "Carregando..."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Quando</th>
                  <th className="px-3 py-2 font-medium">Página</th>
                  <th className="px-3 py-2 font-medium">Origem</th>
                  <th className="px-3 py-2 font-medium">Aparelho</th>
                  <th className="px-5 py-2 font-medium">Local</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100">
                    <td
                      className="whitespace-nowrap px-5 py-2 text-slate-500"
                      title={new Date(v.created_at).toLocaleString("pt-BR")}
                    >
                      {timeAgo(v.created_at)}
                    </td>
                    <td className="px-3 py-2 text-slate-900">{pageName(v.path)}</td>
                    <td className={`px-3 py-2 ${v.entry ? "text-slate-700" : "text-slate-400"}`}>
                      {originOf(v)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {DEVICE_LABEL[v.device] ?? v.device} · {v.browser ?? "—"}
                      {v.os ? ` · ${v.os}` : ""}
                    </td>
                    <td className="px-5 py-2 text-slate-700">
                      {[v.city, v.region].filter(Boolean).join(" · ") || countryName(v.country)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        Contagem própria, sem cookies e sem guardar IP: cada visitante vira um código que muda todo
        dia, então a mesma pessoa conta uma vez por dia. Robôs e buscadores ficam de fora, e os
        navegadores onde alguém entrou neste Control Center também não contam. Visitas com mais de
        13 meses são apagadas.
      </p>
    </section>
  );
}
