import { amtSupabase } from "@/integrations/amt-supabase/client";
import { PUBLIC_PAGES } from "@/lib/seo";

// Visitas do site (/admin › Visitas): relatório agregado do período (função site_visits_report) e as últimas
// páginas vistas. A coleta fica em src/components/site/VisitTracker.tsx + /api/public/visita.

export type VisitRow = { label: string; views: number; visitors: number };
export type VisitTotals = { views: number; visitors: number; entries: number };
export type VisitPoint = { t: string; views: number; visitors: number };

export type VisitsReport = {
  days: number;
  start: string;
  totals: VisitTotals;
  previous: VisitTotals;
  online: number;
  series: VisitPoint[];
  pages: VisitRow[];
  sources: VisitRow[];
  campaigns: VisitRow[];
  devices: VisitRow[];
  browsers: VisitRow[];
  systems: VisitRow[];
  countries: VisitRow[];
  cities: VisitRow[];
};

export type RecentVisit = {
  id: number;
  created_at: string;
  path: string;
  entry: boolean;
  referrer_host: string | null;
  utm_source: string | null;
  device: "mobile" | "tablet" | "desktop";
  browser: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
};

export const TIME_ZONE = "America/Sao_Paulo";

export async function loadVisitsReport(days: number): Promise<VisitsReport> {
  const { data, error } = await amtSupabase.rpc("site_visits_report", { p_days: days });
  if (error || !data) throw new Error("Não foi possível carregar as visitas.");
  return data as VisitsReport;
}

export async function loadRecentVisits(): Promise<RecentVisit[]> {
  const { data, error } = await amtSupabase
    .from("site_visits")
    .select(
      "id, created_at, path, entry, referrer_host, utm_source, device, browser, os, country, region, city",
    )
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error("Não foi possível carregar as últimas visitas.");
  return (data ?? []) as RecentVisit[];
}

const pageTitles = new Map(PUBLIC_PAGES.map((p) => [p.path, p.title]));

/** Nome amigável da página ("/optione" -> "AMT OptiOne..."); landing pages pelo endereço. */
export function pageName(path: string): string {
  return (
    pageTitles.get(path) ?? (path.startsWith("/lp/") ? `Landing page · ${path.slice(4)}` : path)
  );
}

export const DEVICE_LABEL: Record<string, string> = {
  mobile: "Celular",
  tablet: "Tablet",
  desktop: "Computador",
};

let regionNames: Intl.DisplayNames | null = null;
export function countryName(code: string | null): string {
  if (!code || code === "??" || code === "XX" || code === "T1") return "Desconhecido";
  try {
    regionNames ??= new Intl.DisplayNames(["pt-BR"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Data/hora no fuso de São Paulo em partes ("2026-11-20", "14"). */
function spParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: get("hour") };
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type ChartBucket = {
  key: string;
  label: string;
  tooltip: string;
  views: number;
  visitors: number;
};

/** Série completa do período (dias ou horas sem visita entram com zero). */
export function fillSeries(report: VisitsReport, now = new Date()): ChartBucket[] {
  const byKey = new Map(
    report.series.map((p) => [report.days === 1 ? p.t.slice(0, 13) : p.t.slice(0, 10), p]),
  );
  const startDay = spParts(new Date(report.start)).day;
  const buckets: ChartBucket[] = [];
  if (report.days === 1) {
    const currentHour = Number(spParts(now).hour);
    for (let h = 0; h <= currentHour; h++) {
      const hh = String(h).padStart(2, "0");
      const p = byKey.get(`${startDay}T${hh}`);
      buckets.push({
        key: hh,
        label: `${hh}h`,
        tooltip: `Hoje, ${hh}h–${hh}h59`,
        views: p?.views ?? 0,
        visitors: p?.visitors ?? 0,
      });
    }
    return buckets;
  }
  for (let i = 0; i < report.days; i++) {
    const day = addDays(startDay, i);
    const p = byKey.get(day);
    const date = new Date(`${day}T12:00:00Z`);
    buckets.push({
      key: day,
      label: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }),
      tooltip: date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        timeZone: "UTC",
      }),
      views: p?.views ?? 0,
      visitors: p?.visitors ?? 0,
    });
  }
  return buckets;
}

/** Variação contra o período anterior (null quando não há base de comparação). */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
