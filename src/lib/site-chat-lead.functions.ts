import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { SUPPORT_INBOX_URL } from "@/lib/support-inbox";

// Chat do site → lead no funil do /admin (manager_leads, origem "chat-site").
//
// O navegador manda o token da conversa; o servidor confirma o token na Edge Function support-inbox (que devolve
// o id da conversa) antes de gravar, então ninguém cria lead sem ter iniciado uma conversa de verdade. Um lead
// por conversa (canal_ref "whatsapp:<id>"), ligado ao /admin/whatsapp?conversa=<id>.

const input = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30),
  message: z.string().trim().max(1000),
});

export const registrarLeadDoChat = createServerFn({ method: "POST" })
  .validator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    let chatId: string | null = null;
    try {
      const response = await fetch(SUPPORT_INBOX_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "site_poll", token: data.token }),
      });
      const body = (await response.json().catch(() => ({}))) as { chat_id?: string };
      if (response.ok && typeof body.chat_id === "string") chatId = body.chat_id;
    } catch {
      chatId = null;
    }
    if (!chatId) return { ok: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ref = `whatsapp:${chatId}`;
    // canal_ref ainda não está nos tipos gerados do banco (migration 20261110120000).
    const { data: existing } = await supabaseAdmin
      .from("manager_leads")
      .select("id")
      .eq("canal_ref" as never, ref as never)
      .maybeSingle();
    if (existing) return { ok: true as const };
    const { error } = await supabaseAdmin.from("manager_leads").insert({
      nome: data.name,
      telefone: data.phone || null,
      origem: "chat-site",
      status: "novo",
      observacoes: `Conversa iniciada pelo chat do site:\n${data.message}`,
      canal_ref: ref,
    } as never);
    if (error) console.error("chat do site: lead não registrado", error.message);
    return { ok: !error };
  });
