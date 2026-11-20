// Coleta das visitas do site (/api/public/visita): descarta robôs e outros domínios, identifica aparelho,
// navegador, sistema e local aproximado (Cloudflare) e grava pela função site_track_visit do banco, que só guarda
// um hash diário do IP (nunca o IP). Relatório em /admin › Visitas.

import { SITE_HOST, SITE_WWW_HOST, isPublicSeoPath } from "@/lib/seo";

export type VisitPayload = {
  path?: unknown;
  entry?: unknown;
  referrer?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
};

const BOT_UA =
  /bot|crawl|spider|slurp|scrap|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|discord|monitor|uptime|curl|wget|python|axios|node-fetch|undici|go-http|java\/|okhttp|postman/i;

const OWN_HOSTS = new Set([SITE_HOST, SITE_WWW_HOST]);

const str = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function hostOf(request: Request): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  return raw.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua)))
    return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

export function browserOf(ua: string): string {
  if (/edg(e|a|ios)?\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/instagram/i.test(ua)) return "Instagram (app)";
  if (/fban|fbav/i.test(ua)) return "Facebook (app)";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios|chromium/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Outro";
}

export function osOf(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Outro";
}

/** Host do site de origem, sem "www."; vazio quando a navegação veio do próprio site. */
export function referrerHostOf(referrer: string): string {
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    return OWN_HOSTS.has(host) || host === SITE_HOST ? "" : host;
  } catch {
    return "";
  }
}

/** Grava uma visita. Devolve o motivo quando ela é ignorada (útil para testar). */
export async function recordVisit(request: Request, payload: VisitPayload): Promise<"ok" | string> {
  if (!OWN_HOSTS.has(hostOf(request))) return "outro-dominio";

  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return "robo";

  const path = str(payload.path, 300)
    .split(/[?#]/)[0]
    .replace(/(.)\/+$/, "$1");
  if (!path.startsWith("/") || !isPublicSeoPath(path)) return "pagina-fora";

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  if (!ip) return "sem-ip";

  const cf = (
    request as Request & {
      cf?: { country?: string; region?: string; regionCode?: string; city?: string };
    }
  ).cf;
  const entry = payload.entry === true;

  const body = {
    p_path: path,
    p_entry: entry,
    p_referrer_host: entry ? referrerHostOf(str(payload.referrer, 500)) : "",
    p_utm_source: entry ? str(payload.utm_source, 80) : "",
    p_utm_medium: entry ? str(payload.utm_medium, 80) : "",
    p_utm_campaign: entry ? str(payload.utm_campaign, 120) : "",
    p_device: deviceOf(ua),
    p_browser: browserOf(ua),
    p_os: osOf(ua),
    p_country: cf?.country ?? request.headers.get("cf-ipcountry") ?? "",
    p_region: cf?.regionCode ?? cf?.region ?? "",
    p_city: cf?.city ?? "",
    p_ip: ip,
    p_user_agent: ua,
  };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return "sem-config";

  const response = await fetch(`${url}/rest/v1/rpc/site_track_visit`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error("site_track_visit", response.status, await response.text().catch(() => ""));
    return "erro-banco";
  }
  return "ok";
}
