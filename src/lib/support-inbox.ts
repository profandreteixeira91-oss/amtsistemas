// Edge Function support-inbox (projeto Supabase do Dojo Manager): atendimento da AMT pelo Control Center
// (WhatsApp do suporte e chamados) e o chat do site, que fala com o WhatsApp do suporte.

export const SUPPORT_INBOX_URL =
  "https://gudjmkiyprgwgxmzbgji.supabase.co/functions/v1/support-inbox";

async function post<T>(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(SUPPORT_INBOX_URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("O atendimento não respondeu. Verifique a conexão e tente de novo.");
  }
  const result = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir a operação.");
  return result;
}

/** Ação do painel /admin (exige a sessão do Control Center). */
export async function inbox<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  // Import sob demanda: o chat público do site usa este módulo sem carregar o login do /admin.
  const { amtSupabase } = await import("@/integrations/amt-supabase/client");
  const { data } = await amtSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  return post<T>({ action, ...body }, { Authorization: `Bearer ${token}` });
}

/** Ação do chat do site (público; a sessão do visitante vai no corpo como token). */
export function siteChat<T>(
  action: "site_start" | "site_poll" | "site_send",
  body: Record<string, unknown> = {},
): Promise<T> {
  return post<T>({ action, ...body });
}
