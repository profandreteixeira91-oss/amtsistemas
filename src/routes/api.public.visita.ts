import { createFileRoute } from "@tanstack/react-router";

// Recebe a visita de cada página pública do site (VisitTracker, via sendBeacon) e grava sem cookies nem IP.
// Responde sempre 204 para não gerar erro no navegador; o motivo de uma visita ignorada fica no cabeçalho.

export const Route = createFileRoute("/api/public/visita")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let result = "payload-invalido";
        try {
          let payload: unknown = null;
          try {
            payload = JSON.parse((await request.text()).slice(0, 4000));
          } catch {
            // corpo que não é JSON: ignora sem registrar erro
          }
          if (payload && typeof payload === "object") {
            const { recordVisit } = await import("@/lib/site-visits.server");
            result = await recordVisit(request, payload);
          }
        } catch (error) {
          console.error("visita", error);
          result = "erro";
        }
        return new Response(null, {
          status: 204,
          headers: { "cache-control": "no-store", "x-visita": result, "x-robots-tag": "noindex" },
        });
      },
    },
  },
});
