import { createFileRoute } from "@tanstack/react-router";

type Passo = { id: string; ordem: number; dia: number; canal: string; conteudo: string | null };
type Enrollment = { id: string; sequencia_id: string; lead_id: string | null; passo_atual: number; proximo_disparo_em: string; mensagens_geradas: number };
type Lead = { id: string; nome: string | null; empresa: string | null; email: string | null; telefone: string | null };

async function callLovableAI(model: string, messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) throw new Error(`AI ${resp.status}: ${await resp.text()}`);
  const json = await resp.json() as { choices: Array<{ message: { content: string } }> };
  return json.choices[0]?.message?.content ?? "";
}

export const Route = createFileRoute("/api/public/hooks/crm-sequencias-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const providedKey = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || providedKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();

        const { data: enrollments, error: eErr } = await supabaseAdmin
          .from("crm_sequencia_enrollments" as any)
          .select("*")
          .eq("status", "ativa")
          .lte("proximo_disparo_em", now.toISOString())
          .limit(50);
        if (eErr) throw eErr;

        const results: any[] = [];

        for (const enroll of ((enrollments ?? []) as unknown as Enrollment[])) {
          try {
            const { data: passos } = await supabaseAdmin
              .from("crm_sequencia_passos").select("id, ordem, dia, canal, conteudo")
              .eq("sequencia_id", enroll.sequencia_id).order("ordem");
            const lista = (passos ?? []) as Passo[];
            const idx = enroll.passo_atual;

            if (idx >= lista.length) {
              await supabaseAdmin.from("crm_sequencia_enrollments" as any).update({ status: "concluida" }).eq("id", enroll.id);
              results.push({ id: enroll.id, action: "concluida" });
              continue;
            }

            const passo = lista[idx];

            let lead: Lead | null = null;
            if (enroll.lead_id) {
              const { data } = await supabaseAdmin.from("manager_leads").select("id, nome, empresa, email, telefone").eq("id", enroll.lead_id).maybeSingle();
              lead = data as Lead | null;
            }

            let conteudo = passo.conteudo ?? "";
            const vars: Record<string, string> = {
              empresa: lead?.empresa || lead?.nome || "sua empresa",
              nome: lead?.nome || "",
              categoria: "",
            };
            conteudo = conteudo.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

            if (!conteudo.trim()) {
              conteudo = await callLovableAI("google/gemini-2.5-flash", [
                { role: "system", content: "Você é um SDR B2B brasileiro. Direto e consultivo." },
                { role: "user", content: `Escreva UMA mensagem curta de ${passo.canal} para ${vars.empresa}. Objetivo: agendar 15min. Máximo 3 frases.` },
              ]);
            }

            if (enroll.lead_id) {
              await supabaseAdmin.from("crm_mensagens").insert({
                canal: passo.canal, direcao: "saida", lead_id: enroll.lead_id,
                conteudo, status: "pendente",
              });
            }

            const proxIdx = idx + 1;
            let update: any;
            if (proxIdx >= lista.length) {
              update = { status: "concluida", passo_atual: proxIdx, ultima_execucao_em: now.toISOString(), mensagens_geradas: enroll.mensagens_geradas + 1 };
            } else {
              const gap = Math.max(1, (lista[proxIdx].dia ?? 1) - (passo.dia ?? 1));
              const prox = new Date(now); prox.setDate(prox.getDate() + gap);
              update = { passo_atual: proxIdx, proximo_disparo_em: prox.toISOString(), ultima_execucao_em: now.toISOString(), mensagens_geradas: enroll.mensagens_geradas + 1 };
            }
            await supabaseAdmin.from("crm_sequencia_enrollments" as any).update(update).eq("id", enroll.id);
            results.push({ id: enroll.id, canal: passo.canal, action: proxIdx >= lista.length ? "final" : "avancou" });
          } catch (err: any) {
            results.push({ id: enroll.id, error: err.message });
          }
        }

        return new Response(JSON.stringify({ processed: results.length, results, at: now.toISOString() }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
