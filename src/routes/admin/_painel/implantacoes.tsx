import { createFileRoute } from "@tanstack/react-router";

import { ImplementationWorkspace } from "@/components/admin/ImplementationWorkspace";

// ?pedido=<id> guarda o pedido aberto (recarregar e mandar o link mantêm a tela).
export const Route = createFileRoute("/admin/_painel/implantacoes")({
  validateSearch: (s: Record<string, unknown>): { pedido?: string } => ({
    pedido:
      typeof s.pedido === "string" && /^[0-9a-f-]{36}$/i.test(s.pedido) ? s.pedido : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Implantações — Control Center AMT" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ImplantacoesRoute,
});

function ImplantacoesRoute() {
  const { pedido } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ImplementationWorkspace
      selectedId={pedido}
      onSelect={(id) => void navigate({ search: { pedido: id }, replace: true })}
    />
  );
}
