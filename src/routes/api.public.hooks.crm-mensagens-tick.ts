import { createFileRoute } from "@tanstack/react-router";

type Mensagem = {
  id: string;
  canal: string;
  conteudo: string | null;
  lead_id: string | null;
  destinatario: string | null;
  assunto: string | null;
};

type Canal = {
  id: string;
  canal: string;
  provedor: string;
  webhook_url: string | null;
  headers_extras: Record<string, string> | null;
  ativo: boolean;
};

async function enviarViaWebhook(canal: Canal, msg: Mensagem, lead: any) {
  if (!canal.webhook_url) throw new Error("webhook_url não configurado");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(canal.headers_extras ?? {}),
  };
  const payload = {
    mensagem_id: msg.id,
    canal: msg.canal,
    conteudo: msg.conteudo,
    destinatario: msg.destinatario ?? lead?.telefone ?? lead?.email ?? null,
    assunto: msg.assunto,
    lead: lead
      ? { id: lead.id, nome: lead.nome, empresa: lead.empresa, email: lead.email, telefone: lead.telefone }
      : null,
    provedor: canal.provedor,
    origem: "amt-crm",
  };
  const resp = await fetch(canal.webhook_url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`Provedor ${resp.status}: ${text.slice(0, 200)}`);
  let externalId: string | null = null;
  try {
    const j = JSON.parse(text);
    externalId = j.id ?? j.external_id ?? j.message_id ?? null;
  } catch {}
  return { externalId, provedor: canal.provedor };
}

async function enviarViaWhatsappCloud(integ: any, msg: Mensagem, lead: any) {
  const creds = integ.credenciais ?? {};
  const cfg = integ.config ?? {};
  const v = cfg.graph_version ?? "v20.0";
  const to = (msg.destinatario ?? lead?.telefone ?? "").replace(/\D/g, "");
  if (!to) throw new Error("Destinatário sem telefone");
  const resp = await fetch(`https://graph.facebook.com/${v}/${creds.phone_number_id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.access_token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: msg.conteudo ?? "" },
    }),
  });
  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`WhatsApp Cloud ${resp.status}: ${text.slice(0, 200)}`);
  let externalId: string | null = null;
  try { externalId = JSON.parse(text)?.messages?.[0]?.id ?? null; } catch {}
  return { externalId, provedor: "whatsapp_cloud" };
}

async function enviarViaEvolution(integ: any, msg: Mensagem, lead: any) {
  const creds = integ.credenciais ?? {};
  const base = String(creds.base_url ?? "").replace(/\/$/, "");
  const to = (msg.destinatario ?? lead?.telefone ?? "").replace(/\D/g, "");
  if (!to) throw new Error("Destinatário sem telefone");
  const resp = await fetch(`${base}/message/sendText/${encodeURIComponent(creds.instance)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: creds.api_key },
    body: JSON.stringify({ number: to, text: msg.conteudo ?? "" }),
  });
  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`Evolution ${resp.status}: ${text.slice(0, 200)}`);
  let externalId: string | null = null;
  try { externalId = JSON.parse(text)?.key?.id ?? null; } catch {}
  return { externalId, provedor: "evolution_api" };
}

async function despachar(canal: Canal, msg: Mensagem, lead: any, supabaseAdmin: any) {
  // Se o canal está apontando pra n8n/make/custom, usa webhook direto.
  if (["n8n_webhook", "make_webhook", "custom"].includes(canal.provedor)) {
    return enviarViaWebhook(canal, msg, lead);
  }
  // Provedores nativos precisam buscar credenciais em crm_integracoes.
  const tipoInteg = canal.provedor; // whatsapp_cloud | evolution_api
  const { data: integ } = await supabaseAdmin
    .from("crm_integracoes")
    .select("*")
    .eq("tipo", tipoInteg)
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!integ) {
    // fallback: se tiver webhook_url no canal, usa
    if (canal.webhook_url) return enviarViaWebhook(canal, msg, lead);
    throw new Error(`Integração ${tipoInteg} não configurada em /crm/integracoes`);
  }
  if (tipoInteg === "whatsapp_cloud") return enviarViaWhatsappCloud(integ, msg, lead);
  if (tipoInteg === "evolution_api") return enviarViaEvolution(integ, msg, lead);
  throw new Error(`Provedor ${tipoInteg} sem handler`);
}

export const Route = createFileRoute("/api/public/hooks/crm-mensagens-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || providedKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: pendentes, error } = await supabaseAdmin
          .from("crm_mensagens")
          .select("id, canal, conteudo, lead_id, destinatario, assunto")
          .eq("status", "pendente")
          .eq("direcao", "saida")
          .order("created_at", { ascending: true })
          .limit(30);
        if (error) throw error;

        const results: any[] = [];
        for (const m of ((pendentes ?? []) as Mensagem[])) {
          try {
            const { data: canaisAtivos } = await (supabaseAdmin as any)
              .from("crm_canais_config")
              .select("*")
              .eq("canal", m.canal)
              .eq("ativo", true)
              .limit(1);
            const canal = (canaisAtivos ?? [])[0] as Canal | undefined;
            if (!canal) {
              await supabaseAdmin
                .from("crm_mensagens")
                .update({ status: "falha", erro: `Nenhum provedor ativo para canal ${m.canal}` })
                .eq("id", m.id);
              results.push({ id: m.id, ok: false, motivo: "sem_provedor" });
              continue;
            }

            let lead: any = null;
            if (m.lead_id) {
              const { data } = await supabaseAdmin
                .from("manager_leads")
                .select("id, nome, empresa, email, telefone")
                .eq("id", m.lead_id)
                .maybeSingle();
              lead = data;
            }

            const { externalId, provedor } = await despachar(canal, m, lead, supabaseAdmin);
            await supabaseAdmin
              .from("crm_mensagens")
              .update({
                status: "enviada",
                enviado_via: provedor,
                external_id: externalId,
                erro: null,
                enviado_em: new Date().toISOString(),
              })
              .eq("id", m.id);
            results.push({ id: m.id, ok: true, provedor, external_id: externalId });
          } catch (err: any) {
            await supabaseAdmin
              .from("crm_mensagens")
              .update({ status: "falha", erro: String(err?.message ?? err).slice(0, 500) })
              .eq("id", m.id);
            results.push({ id: m.id, ok: false, erro: String(err?.message ?? err) });
          }
        }

        return new Response(
          JSON.stringify({ processados: results.length, results, at: new Date().toISOString() }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
