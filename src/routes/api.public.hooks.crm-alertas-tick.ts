import { createFileRoute } from "@tanstack/react-router";
import { gerarAlertasInternal } from "@/lib/crm/alertas.functions";

/**
 * Gera alertas inteligentes periodicamente (recomendado: a cada 30min).
 * Idempotente por (tipo, lead_id, dia).
 */
export const Route = createFileRoute("/api/public/hooks/crm-alertas-tick")({
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
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const r = await gerarAlertasInternal(supabaseAdmin);
        return new Response(JSON.stringify({ ok: true, ...r }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
