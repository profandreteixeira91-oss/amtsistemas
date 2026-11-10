import { amtSupabase } from "@/integrations/amt-supabase/client";

// Alertas de atendimento do Control Center por Web Push (service worker /admin-sw.js + Edge Function admin-push).
// Cada aparelho (navegador do computador ou do celular) se inscreve uma vez; os alertas chegam mesmo com o /admin
// fechado. No iPhone, só funciona com o /admin adicionado à Tela de Início (abrir pelo ícone).

export const VAPID_PUBLIC_KEY = "BCoLSgN_j2mXxzrP50IY8w0GZG9O5O08K7cW_uPBFNbp7HwE-LQlfE17ohCovilqPwRkCPW-FwIlH8ktA8pKneY";
const ADMIN_PUSH_URL = "https://yqxmxevphdumyuwlvppg.supabase.co/functions/v1/admin-push";
const SW_URL = "/admin-sw.js";

export type AlertsState = "unsupported" | "ios-install" | "blocked" | "off" | "on";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const SW_SCOPE = "/admin";
const SW_BROKEN_MESSAGE =
  "O navegador não conseguiu instalar os alertas. Feche todas as janelas dele, abra de novo e tente outra vez. Se continuar, apague os dados do site: cadeado ao lado do endereço › Configurações do site › Excluir dados. Depois entre no /admin e ative de novo.";

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existing) return existing;
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
  } catch (error) {
    // "Operation has been aborted" (AbortError) costuma ser registro antigo travado ou armazenamento do navegador
    // com problema: remove o que houver para o /admin e tenta mais uma vez.
    console.warn("Registro do service worker falhou, tentando de novo", error);
    for (const reg of await navigator.serviceWorker.getRegistrations()) {
      if (new URL(reg.scope).pathname.startsWith(SW_SCOPE)) await reg.unregister().catch(() => false);
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      return await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" });
    } catch (retryError) {
      console.error(retryError);
      throw new Error(SW_BROKEN_MESSAGE);
    }
  }
}

/** Situação dos alertas neste aparelho. */
export async function alertsState(): Promise<AlertsState> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIos() && !isStandalone() ? "ios-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "blocked";
  const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

function deviceName() {
  const ua = navigator.userAgent;
  const os = /android/i.test(ua) ? "Android" : isIos() ? "iPhone/iPad" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : "Outro";
  const browser = /edg\//i.test(ua) ? "Edge" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Navegador";
  return `${browser} · ${os}`;
}

/** Pede permissão, inscreve o aparelho no push e guarda a inscrição do admin logado. */
export async function enableAlerts(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("As notificações foram bloqueadas neste navegador.");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } };
  const { data } = await amtSupabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId || !json.keys?.p256dh || !json.keys.auth) throw new Error("Não foi possível ativar os alertas neste aparelho.");
  const { error } = await amtSupabase
    .from("admin_push_subscriptions")
    .upsert({ user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, device: deviceName(), active: true }, { onConflict: "endpoint" });
  if (error) throw new Error("Não foi possível salvar a inscrição deste aparelho.");
}

/** Desliga os alertas só neste aparelho. */
export async function disableAlerts(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await amtSupabase.from("admin_push_subscriptions").update({ active: false }).eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/** Manda um alerta de teste para os aparelhos ativos de quem está logado. */
export async function sendTestAlert(): Promise<void> {
  const { data } = await amtSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const response = await fetch(ADMIN_PUSH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ action: "test" }),
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string; sent?: number };
  if (!response.ok) throw new Error(result.error ?? "Não foi possível enviar o teste.");
  if (!result.sent) throw new Error("O teste não foi entregue a nenhum aparelho.");
}
