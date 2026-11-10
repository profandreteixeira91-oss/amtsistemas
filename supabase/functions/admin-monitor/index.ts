import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Monitor automático do Control Center (/admin › Monitor).
//
// Verifica os itens de monitor_targets (sites, WhatsApp do suporte na Evolution, APIs dos bancos), grava em
// monitor_checks e, quando um item cai (2 falhas seguidas) ou volta, abre/fecha o incidente e manda alerta pela
// Edge Function admin-push. Guarda 30 dias de histórico.
//
// Entradas: pg_cron a cada 5 min (cabeçalho x-admin-push-secret = ADMIN_PUSH_SECRET) ou "Verificar agora" no
// painel (POST { action: "run" } com o token de sessão do Control Center).
// Segredos: ADMIN_PUSH_SECRET, EVOLUTION_API_URL, EVOLUTION_API_KEY.
// Deploy: npx supabase functions deploy admin-monitor --project-ref yqxmxevphdumyuwlvppg --use-api --no-verify-jwt

const ALLOWED_ORIGINS = ["https://amtsistemas.com.br", "https://www.amtsistemas.com.br"];
const TIMEOUT_MS = 15_000;
const FAILURES_TO_ALERT = 2;
const KEEP_DAYS = 30;

type Target = { id: string; name: string; kind: "http" | "evolution" | "supabase"; url: string; status: string; consecutive_failures: number };
type Result = { ok: boolean; status_code: number | null; response_ms: number | null; error: string | null };

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)
    ? { "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, apikey, content-type, x-client-info", "access-control-allow-methods": "POST, OPTIONS", vary: "origin" }
    : {};
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const sb = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });

async function timed(url: string, init: RequestInit = {}): Promise<{ res: Response | null; ms: number; error: string | null }> {
  const started = performance.now();
  try {
    const res = await fetch(url, { redirect: "follow", ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    await res.body?.cancel();
    return { res, ms: Math.round(performance.now() - started), error: null };
  } catch (err) {
    const name = (err as Error)?.name;
    return { res: null, ms: Math.round(performance.now() - started), error: name === "TimeoutError" || name === "AbortError" ? "Sem resposta em 15 s" : String((err as Error)?.message ?? err).slice(0, 200) };
  }
}

async function check(t: Target): Promise<Result> {
  if (t.kind === "http") {
    const { res, ms, error } = await timed(t.url, { headers: { "user-agent": "AMT-Monitor/1.0" } });
    if (!res) return { ok: false, status_code: null, response_ms: null, error };
    return { ok: res.status < 400, status_code: res.status, response_ms: ms, error: res.status < 400 ? null : `HTTP ${res.status}` };
  }
  if (t.kind === "supabase") {
    // Sem chave a API responde 401: o que importa é responder (5xx ou silêncio = fora do ar).
    const { res, ms, error } = await timed(`${t.url.replace(/\/+$/, "")}/rest/v1/`);
    if (!res) return { ok: false, status_code: null, response_ms: null, error };
    return { ok: res.status < 500, status_code: res.status, response_ms: ms, error: res.status < 500 ? null : `HTTP ${res.status}` };
  }
  // evolution: a instância precisa estar conectada ao WhatsApp
  const base = (Deno.env.get("EVOLUTION_API_URL") ?? "").replace(/\/+$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY") ?? "";
  if (!base || !key) return { ok: false, status_code: null, response_ms: null, error: "Evolution não configurada no monitor" };
  const started = performance.now();
  try {
    const res = await fetch(`${base}/instance/connectionState/${encodeURIComponent(t.url)}`, { headers: { apikey: key }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const ms = Math.round(performance.now() - started);
    const body = (await res.json().catch(() => ({}))) as { instance?: { state?: string }; state?: string };
    const state = String(body?.instance?.state ?? body?.state ?? "").toLowerCase();
    if (!res.ok) return { ok: false, status_code: res.status, response_ms: ms, error: `Evolution HTTP ${res.status}` };
    return { ok: state === "open", status_code: res.status, response_ms: ms, error: state === "open" ? null : `WhatsApp desconectado (${state || "sem estado"})` };
  } catch (err) {
    return { ok: false, status_code: null, response_ms: null, error: (err as Error)?.name === "TimeoutError" ? "Evolution sem resposta em 15 s" : "Evolution fora do ar" };
  }
}

async function notify(title: string, body: string, tag: string) {
  const secret = Deno.env.get("ADMIN_PUSH_SECRET") ?? "";
  if (!secret) return;
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/admin-push`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-push-secret": secret },
    body: JSON.stringify({ title, body, url: "/admin/monitor", tag }),
  }).catch(() => undefined);
}

async function runAll() {
  const db = sb();
  const { data } = await db.from("monitor_targets").select("id, name, kind, url, status, consecutive_failures").eq("active", true).order("sort");
  const targets = (data ?? []) as Target[];
  const now = new Date().toISOString();
  const results = await Promise.all(targets.map(async (t) => ({ t, r: await check(t) })));
  for (const { t, r } of results) {
    await db.from("monitor_checks").insert({ target_id: t.id, ok: r.ok, status_code: r.status_code, response_ms: r.response_ms, error: r.error, checked_at: now });
    const failures = r.ok ? 0 : t.consecutive_failures + 1;
    const patch: Record<string, unknown> = { consecutive_failures: failures, last_checked_at: now, last_response_ms: r.response_ms, last_error: r.error };
    if (r.ok && t.status !== "up") {
      patch.status = "up";
      patch.last_change_at = now;
      if (t.status === "down") {
        await db.from("monitor_incidents").update({ resolved_at: now }).eq("target_id", t.id).is("resolved_at", null);
        await notify(`🟢 ${t.name} voltou`, "Funcionando normalmente de novo.", `monitor-${t.id}`);
      }
    } else if (!r.ok && failures >= FAILURES_TO_ALERT && t.status !== "down") {
      patch.status = "down";
      patch.last_change_at = now;
      await db.from("monitor_incidents").insert({ target_id: t.id, started_at: now, error: r.error });
      await notify(`🔴 ${t.name} fora do ar`, r.error ?? "Falhou nas últimas verificações.", `monitor-${t.id}`);
    }
    await db.from("monitor_targets").update(patch).eq("id", t.id);
  }
  await db.from("monitor_checks").delete().lt("checked_at", new Date(Date.now() - KEEP_DAYS * 86400000).toISOString());
  return { checked: results.length, down: results.filter(({ r }) => !r.ok).map(({ t, r }) => ({ id: t.id, error: r.error })) };
}

Deno.serve(async (req: Request) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, headers);

  const internal = req.headers.get("x-admin-push-secret") ?? "";
  if (internal) {
    if (!safeEqual(internal, Deno.env.get("ADMIN_PUSH_SECRET") ?? "")) return json({ error: "Não autorizado." }, 401);
    return json(await runAll());
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!token || body.action !== "run") return json({ error: "Não autorizado." }, 401, headers);
  const { data: auth } = await sb().auth.getUser(token);
  const userId = auth?.user?.id;
  if (!userId) return json({ error: "Sessão expirada. Entre novamente." }, 401, headers);
  const { data: profile } = await sb().from("admin_users").select("user_id").eq("user_id", userId).eq("active", true).maybeSingle();
  if (!profile) return json({ error: "Acesso restrito aos admins do Control Center." }, 403, headers);
  return json(await runAll(), 200, headers);
});
