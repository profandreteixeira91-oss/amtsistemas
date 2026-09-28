import { createFileRoute } from "@tanstack/react-router";

/**
 * Receptor universal de mensagens entrantes.
 * Payload esperado (todos opcionais menos canal + conteudo):
 * {
 *   canal: "whatsapp" | "email" | "instagram" | "ligacao",
 *   conteudo: string,
 *   remetente: string,       // telefone/email/handle
 *   nome?: string,           // nome exibido pelo provedor
 *   empresa?: string,
 *   external_id?: string,
 *   metadata?: object
 * }
 * Chame com header `apikey: <publishable_key>` ou `x-webhook-key`.
 * Faz match por telefone/email com manager_leads; cria lead novo se não existir.
 */
export const Route = createFileRoute("/api/public/hooks/crm-inbox")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("x-webhook-key") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || providedKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: any;
        try { body = await request.json(); } catch {
          return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const canal = String(body.canal ?? "whatsapp");
        const conteudo = String(body.conteudo ?? "").slice(0, 8000);
        const remetente: string = body.remetente ?? "";
        if (!conteudo) {
          return new Response(JSON.stringify({ error: "conteudo_required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Match lead por telefone/email
        let leadId: string | null = null;
        if (remetente) {
          const isEmail = remetente.includes("@");
          const col = isEmail ? "email" : "telefone";
          const { data: existente } = await supabaseAdmin
            .from("manager_leads")
            .select("id")
            .eq(col, remetente)
            .limit(1)
            .maybeSingle();
          if (existente?.id) {
            leadId = existente.id;
          } else {
            const { data: novo } = await supabaseAdmin
              .from("manager_leads")
              .insert({
                nome: body.nome ?? remetente,
                empresa: body.empresa ?? null,
                email: isEmail ? remetente : null,
                telefone: isEmail ? null : remetente,
                origem: `inbox_${canal}`,
                status: "novo",
              })
              .select("id")
              .single();
            leadId = novo?.id ?? null;
          }
        }

        const { data: msg, error } = await supabaseAdmin
          .from("crm_mensagens")
          .insert({
            canal,
            direcao: "entrada",
            conteudo,
            lead_id: leadId,
            destinatario: remetente || null,
            status: "recebida",
            external_id: body.external_id ?? null,
            enviado_via: body.provedor ?? null,
          })
          .select("id")
          .single();
        if (error) throw error;

        // Análise IA best-effort (não bloqueia a resposta)
        if (msg?.id && process.env.LOVABLE_API_KEY) {
          try {
            const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.LOVABLE_API_KEY}` },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: "Retorne SOMENTE JSON válido." },
                  { role: "user", content: `Analise e retorne {"sentimento":"positivo|neutro|negativo","intencao":"duvida|objecao|interesse_compra|cancelamento|elogio|reclamacao|agendamento|outro","urgencia":"baixa|media|alta"}. Mensagem: "${conteudo}"` },
                ],
              }),
            });
            if (aiResp.ok) {
              const j = await aiResp.json() as any;
              const txt = j.choices?.[0]?.message?.content ?? "";
              const m = txt.match(/\{[\s\S]*\}/);
              if (m) {
                const parsed = JSON.parse(m[0]);
                await supabaseAdmin.from("crm_mensagens").update({
                  sentimento: parsed.sentimento, intencao: parsed.intencao,
                  urgencia: parsed.urgencia, analise_ia: parsed,
                }).eq("id", msg.id);
              }
            }
          } catch { /* silencioso */ }
        }

        return new Response(JSON.stringify({ ok: true, mensagem_id: msg.id, lead_id: leadId }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
