import { amtSupabase } from "@/integrations/amt-supabase/client";

// Monitor automático (/admin › Monitor): leitura das tabelas monitor_* e o botão "Verificar agora", que chama a
// Edge Function admin-monitor com a sessão do Control Center. As verificações automáticas rodam a cada 5 min (pg_cron).

const ADMIN_MONITOR_URL = "https://yqxmxevphdumyuwlvppg.supabase.co/functions/v1/admin-monitor";

export type MonitorTarget = {
  id: string;
  name: string;
  kind: "http" | "evolution" | "supabase";
  url: string;
  system: string | null;
  status: "unknown" | "up" | "down";
  consecutive_failures: number;
  last_checked_at: string | null;
  last_change_at: string | null;
  last_response_ms: number | null;
  last_error: string | null;
};

export type MonitorUptime = { target_id: string; uptime_24h: number | null; uptime_7d: number | null; avg_ms_24h: number | null; checks_24h: number };
export type MonitorHour = { target_id: string; hour: string; total: number; failures: number };
export type MonitorIncident = { id: number; target_id: string; started_at: string; resolved_at: string | null; error: string | null };

export type MonitorData = { targets: MonitorTarget[]; uptime: MonitorUptime[]; timeline: MonitorHour[]; incidents: MonitorIncident[] };

export async function loadMonitor(): Promise<MonitorData> {
  const [targets, uptime, timeline, incidents] = await Promise.all([
    amtSupabase.from("monitor_targets").select("*").eq("active", true).order("sort"),
    amtSupabase.rpc("monitor_uptime"),
    amtSupabase.rpc("monitor_timeline"),
    amtSupabase.from("monitor_incidents").select("*").order("started_at", { ascending: false }).limit(30),
  ]);
  if (targets.error) throw new Error("Não foi possível carregar o monitor.");
  return {
    targets: (targets.data ?? []) as MonitorTarget[],
    uptime: (uptime.data ?? []) as MonitorUptime[],
    timeline: (timeline.data ?? []) as MonitorHour[],
    incidents: (incidents.data ?? []) as MonitorIncident[],
  };
}

/** Roda todas as verificações agora (mesma rotina do agendamento). */
export async function runMonitorNow(): Promise<void> {
  const { data } = await amtSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const response = await fetch(ADMIN_MONITOR_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ action: "run" }),
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Não foi possível verificar agora.");
}

/** Quantos itens estão fora do ar (null = monitor ainda sem leitura). */
export async function monitorDownCount(): Promise<number | null> {
  const { data, error } = await amtSupabase.from("monitor_targets").select("status").eq("active", true);
  if (error || !data?.length) return null;
  if (data.every((t) => t.status === "unknown")) return null;
  return data.filter((t) => t.status === "down").length;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "nunca";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}

export function duration(fromIso: string, toIso: string | null): string {
  const minutes = Math.max(1, Math.round(((toIso ? new Date(toIso).getTime() : Date.now()) - new Date(fromIso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ${minutes % 60} min` : `${Math.floor(hours / 24)} d ${hours % 24} h`;
}
