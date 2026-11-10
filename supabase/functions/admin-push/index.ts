import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Alertas do Control Center (/admin) por Web Push: chegam no navegador e no celular mesmo com o /admin fechado.
//
// Duas entradas:
// - Interna: POST com o cabeçalho x-admin-push-secret (ADMIN_PUSH_SECRET), vinda dos gatilhos dos bancos
//   (lead novo no amt-sistemas; mensagem de WhatsApp e de chamado no projeto do Dojo, via public.admin_notify).
//   Corpo { title, body, url, tag }: vai para todos os aparelhos ativos dos admins do Control Center.
// - Painel: POST { action: "test" } com o token de sessão do Control Center: manda um teste para os aparelhos
//   de quem pediu.
//
// Segredos: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, ADMIN_PUSH_SECRET.
// Deploy: npx supabase functions deploy admin-push --project-ref yqxmxevphdumyuwlvppg --use-api --no-verify-jwt

const ALLOWED_ORIGINS = ["https://amtsistemas.com.br", "https://www.amtsistemas.com.br"];

type Payload = { title: string; body: string; url: string; tag?: string };
type Subscription = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

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

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Envia para os aparelhos; os que o serviço de push recusa de vez (404/410) são desativados. */
async function deliver(subs: Subscription[], payload: Payload) {
  const sb = admin();
  const message = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message, { TTL: 3600, urgency: "high" });
        sent++;
        await sb.from("admin_push_subscriptions").update({ last_success_at: new Date().toISOString(), last_error: null }).eq("id", s.id);
      } catch (err) {
        failed++;
        const status = (err as { statusCode?: number })?.statusCode ?? 0;
        await sb
          .from("admin_push_subscriptions")
          .update({ last_error: `HTTP ${status}`.slice(0, 200), ...(status === 404 || status === 410 ? { active: false } : {}) })
          .eq("id", s.id);
      }
    }),
  );
  return { sent, failed };
}

async function activeAdminSubscriptions(userId?: string): Promise<Subscription[]> {
  const sb = admin();
  const { data: admins } = await sb.from("admin_users").select("user_id").eq("active", true);
  const ids = (admins ?? []).map((a) => a.user_id).filter((id) => !userId || id === userId);
  if (!ids.length) return [];
  const { data } = await sb.from("admin_push_subscriptions").select("id, user_id, endpoint, p256dh, auth").eq("active", true).in("user_id", ids);
  return (data ?? []) as Subscription[];
}

Deno.serve(async (req: Request) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, headers);

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  if (!publicKey || !privateKey) return json({ error: "Alertas não configurados (chaves VAPID)." }, 503, headers);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@amtsistemas.com.br", publicKey, privateKey);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Entrada interna (gatilhos dos bancos).
  const internal = req.headers.get("x-admin-push-secret") ?? "";
  if (internal) {
    if (!safeEqual(internal, Deno.env.get("ADMIN_PUSH_SECRET") ?? "")) return json({ error: "Não autorizado." }, 401);
    const payload: Payload = { title: str(body.title, 120) || "AMT Control Center", body: str(body.body, 300), url: str(body.url, 300) || "/admin", tag: str(body.tag, 120) || undefined };
    if (!payload.url.startsWith("/admin")) payload.url = "/admin";
    return json(await deliver(await activeAdminSubscriptions(), payload));
  }

  // Painel: teste para os aparelhos de quem pediu.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token || body.action !== "test") return json({ error: "Não autorizado." }, 401, headers);
  const { data: auth } = await admin().auth.getUser(token);
  const userId = auth?.user?.id;
  if (!userId) return json({ error: "Sessão expirada. Entre novamente." }, 401, headers);
  const { data: profile } = await admin().from("admin_users").select("user_id").eq("user_id", userId).eq("active", true).maybeSingle();
  if (!profile) return json({ error: "Acesso restrito aos admins do Control Center." }, 403, headers);
  const subs = await activeAdminSubscriptions(userId);
  if (!subs.length) return json({ error: "Nenhum aparelho com alertas ativos." }, 404, headers);
  return json(await deliver(subs, { title: "Alertas do Control Center", body: "Tudo certo: este aparelho recebe os alertas de atendimento.", url: "/admin", tag: "teste" }), 200, headers);
});
