import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/asaas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        let payload: any = {};
        try { payload = body ? JSON.parse(body) : {}; } catch { payload = { raw: body }; }
        const { registrarWebhookAsaas } = await import("@/lib/amt-admin/asaas.server");
        try {
          await registrarWebhookAsaas(payload);
          return Response.json({ ok: true });
        } catch (e: any) {
          return Response.json({ ok: false, erro: String(e?.message ?? e) }, { status: 500 });
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST para receber webhooks Asaas" }),
    },
  },
});
