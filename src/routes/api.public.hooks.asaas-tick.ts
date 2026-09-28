import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/asaas-tick")({
  server: {
    handlers: {
      POST: async () => {
        const { processarFilaAsaas } = await import("@/lib/amt-admin/asaas.server");
        try {
          const r = await processarFilaAsaas();
          return Response.json({ ok: true, ...r });
        } catch (e: any) {
          return Response.json({ ok: false, erro: String(e?.message ?? e) }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true }),
    },
  },
});
