import { createFileRoute } from "@tanstack/react-router";

import { SupportWhatsAppWorkspace } from "@/components/admin/SupportWhatsAppWorkspace";

// ?conversa=<id da conversa> ou ?conversa=t:<id do chamado> abre direto a conversa ou o chamado.
export const Route = createFileRoute("/admin/_painel/whatsapp")({
  validateSearch: (s: Record<string, unknown>): { conversa?: string } => ({
    conversa: typeof s.conversa === "string" && /^(t:)?[0-9a-f-]{36}$/i.test(s.conversa) ? s.conversa : undefined,
  }),
  head: () => ({ meta: [{ title: "WhatsApp — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: WhatsAppRoute,
});

function WhatsAppRoute() {
  const { conversa } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <SupportWhatsAppWorkspace selected={conversa ?? null} onSelect={(id) => void navigate({ search: id ? { conversa: id } : {}, replace: true })} />;
}
