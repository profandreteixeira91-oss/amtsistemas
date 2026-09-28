import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CheckResult = {
  status: "up" | "down" | "degraded" | "timeout";
  http_status: number | null;
  latencia_ms: number;
  erro: string | null;
};

async function runHttpCheck(alvo: {
  url: string;
  metodo: string;
  headers: Record<string, string> | null;
  esperado_status: number;
  timeout_segundos: number;
}): Promise<CheckResult> {
  const controller = new AbortController();
  const timeoutMs = (alvo.timeout_segundos || 10) * 1000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(alvo.url, {
      method: alvo.metodo || "GET",
      headers: alvo.headers ?? {},
      signal: controller.signal,
    });
    const latencia = Date.now() - start;
    const ok = res.status === alvo.esperado_status;
    const degraded = !ok && res.status >= 200 && res.status < 500;
    return {
      status: ok ? "up" : degraded ? "degraded" : "down",
      http_status: res.status,
      latencia_ms: latencia,
      erro: ok ? null : `HTTP ${res.status} (esperado ${alvo.esperado_status})`,
    };
  } catch (err) {
    const latencia = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      status: isTimeout ? "timeout" : "down",
      http_status: null,
      latencia_ms: latencia,
      erro: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function processAlvo(supabase: any, alvoId: string) {
  const { data: alvo, error } = await supabase
    .from("manager_monitor_alvos")
    .select("*")
    .eq("id", alvoId)
    .maybeSingle();
  if (error || !alvo) throw new Error(error?.message ?? "Alvo não encontrado");

  const result = await runHttpCheck(alvo);

  await supabase.from("manager_monitor_checks").insert({
    alvo_id: alvo.id,
    status: result.status,
    http_status: result.http_status,
    latencia_ms: result.latencia_ms,
    erro: result.erro,
  });

  // Compute uptime 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("manager_monitor_checks")
    .select("status")
    .eq("alvo_id", alvo.id)
    .gte("checado_em", since);
  const total = recent?.length ?? 0;
  const ups = recent?.filter((c: any) => c.status === "up").length ?? 0;
  const uptime = total > 0 ? Number(((ups / total) * 100).toFixed(2)) : null;

  await supabase
    .from("manager_monitor_alvos")
    .update({
      ultimo_check_em: new Date().toISOString(),
      ultimo_status: result.status,
      ultima_latencia_ms: result.latencia_ms,
      ultimo_erro: result.erro,
      uptime_24h: uptime,
    })
    .eq("id", alvo.id);

  return result;
}

export const runMonitorCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { alvoId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    return processAlvo(context.supabase, data.alvoId);
  });

export const runAllMonitorChecks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_super_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: alvos, error } = await context.supabase
      .from("manager_monitor_alvos")
      .select("id")
      .eq("ativo", true);
    if (error) throw error;

    const results = await Promise.allSettled(
      (alvos ?? []).map((a: any) => processAlvo(context.supabase, a.id)),
    );
    return {
      total: alvos?.length ?? 0,
      ok: results.filter((r) => r.status === "fulfilled").length,
      falhas: results.filter((r) => r.status === "rejected").length,
    };
  });
