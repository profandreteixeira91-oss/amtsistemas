import { createFileRoute } from "@tanstack/react-router";
import { runWorkflow } from "@/lib/crm/workflows.functions";

/**
 * Tick horário para workflows agendados ou baseados em tempo.
 * Percorre workflows ativos com gatilho_tipo em [sem_contato_dias, agendado].
 */
export const Route = createFileRoute("/api/public/hooks/crm-workflows-tick")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: workflows } = await (supabaseAdmin as any)
          .from("crm_workflows")
          .select("*")
          .eq("ativo", true)
          .in("gatilho_tipo", ["sem_contato_dias", "agendado", "score_atingido"]);

        const resumo: any[] = [];
        for (const wf of workflows ?? []) {
          try {
            if (wf.gatilho_tipo === "sem_contato_dias") {
              const dias = Number(wf.gatilho_config?.dias ?? 7);
              const limite = new Date(Date.now() - dias * 86400e3).toISOString();
              const { data: leads } = await (supabaseAdmin as any)
                .from("manager_leads")
                .select("*")
                .lte("ultimo_contato", limite)
                .limit(20);
              for (const lead of leads ?? []) {
                const r = await runWorkflow(supabaseAdmin, wf, { lead }, "tick");
                resumo.push({ wf: wf.nome, lead_id: lead.id, status: r.status });
              }
            } else if (wf.gatilho_tipo === "score_atingido") {
              const min = Number(wf.gatilho_config?.score_min ?? 70);
              const { data: leads } = await (supabaseAdmin as any)
                .from("manager_leads").select("*")
                .gte("score", min).limit(20);
              for (const lead of leads ?? []) {
                const r = await runWorkflow(supabaseAdmin, wf, { lead }, "tick");
                resumo.push({ wf: wf.nome, lead_id: lead.id, status: r.status });
              }
            } else if (wf.gatilho_tipo === "agendado") {
              const r = await runWorkflow(supabaseAdmin, wf, {}, "tick");
              resumo.push({ wf: wf.nome, status: r.status });
            }
          } catch (e: any) {
            resumo.push({ wf: wf.nome, status: "erro", erro: String(e?.message ?? e) });
          }
        }
        return Response.json({ ok: true, processados: resumo.length, resumo });
      },
    },
  },
});
