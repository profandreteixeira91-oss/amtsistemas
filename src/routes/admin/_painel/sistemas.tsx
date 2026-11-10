import { createFileRoute } from "@tanstack/react-router";

import { SystemsWorkspace } from "@/components/admin/SystemsWorkspace";
import { systems } from "@/lib/admin/systems";

// ?sistema=<id> guarda o sistema aberto (recarregar e mandar o link mantêm a tela).
export const Route = createFileRoute("/admin/_painel/sistemas")({
  validateSearch: (s: Record<string, unknown>): { sistema?: string } => ({
    sistema: typeof s.sistema === "string" && systems.some((system) => system.id === s.sistema) ? s.sistema : undefined,
  }),
  head: () => ({ meta: [{ title: "Sistemas — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SistemasRoute,
});

function SistemasRoute() {
  const { sistema } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <SystemsWorkspace selectedId={sistema ?? systems[0].id} onSelect={(id) => void navigate({ search: { sistema: id }, replace: true })} />;
}
