import { createFileRoute } from "@tanstack/react-router";

import { LeadsWorkspace } from "@/components/admin/LeadsWorkspace";

// ?lead=<id> abre o lead direto (links dos Formulários e dos alertas).
export const Route = createFileRoute("/admin/_painel/leads")({
  validateSearch: (s: Record<string, unknown>): { lead?: string } => ({
    lead: typeof s.lead === "string" && /^[0-9a-f-]{36}$/i.test(s.lead) ? s.lead : undefined,
  }),
  head: () => ({ meta: [{ title: "Leads — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LeadsRoute,
});

function LeadsRoute() {
  const { lead } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <LeadsWorkspace selectedId={lead ?? null} onSelect={(id) => void navigate({ search: id ? { lead: id } : {}, replace: true })} />;
}
