import { createFileRoute } from "@tanstack/react-router";

/**
 * Recalcula scores em lote. Prioriza leads sem score ou desatualizados (>48h).
 * Autenticado com SUPABASE_PUBLISHABLE_KEY no header `apikey`.
 */
export const Route = createFileRoute("/api/public/hooks/crm-scoring-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const providedKey =
          request.headers.get("apikey") ??
          request.headers.get("x-webhook-key") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!providedKey || providedKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: "no_ai_key" }), { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const doisDiasAtras = new Date(Date.now() - 2 * 86400_000).toISOString();
        const { data: leads } = await supabaseAdmin.from("manager_leads")
          .select("id, nome, empresa, email, telefone, origem, status, observacoes, score, score_atualizado_em")
          .not("status", "in", '("cliente","perdido","descartado")')
          .or(`score.is.null,score_atualizado_em.lt.${doisDiasAtras}`)
          .limit(20);

        let processados = 0;
        for (const lead of leads ?? []) {
          try {
            const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: "Retorne SOMENTE JSON válido." },
                  { role: "user", content: `Score 0-100 para o lead B2B abaixo (AMT vende ERP para restaurantes/comércio). Retorne {"score":n,"motivo":"..."}. Lead: ${JSON.stringify(lead)}` },
                ],
              }),
            });
            if (!resp.ok) continue;
            const j = await resp.json() as any;
            const txt = j.choices?.[0]?.message?.content ?? "";
            const m = txt.match(/\{[\s\S]*\}/);
            if (!m) continue;
            const parsed = JSON.parse(m[0]);
            await supabaseAdmin.from("manager_leads").update({
              score: Math.max(0, Math.min(100, Math.round(parsed.score))),
              score_motivo: String(parsed.motivo ?? "").slice(0, 300),
              score_atualizado_em: new Date().toISOString(),
            }).eq("id", lead.id);
            processados++;
          } catch { /* segue para o próximo */ }
        }

        return new Response(JSON.stringify({ ok: true, processados, verificados: leads?.length ?? 0 }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
