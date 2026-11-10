import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";

// Layout dos módulos do Control Center (sem segmento na URL): menu lateral e verificação da sessão.
export const Route = createFileRoute("/admin/_painel")({
  component: AdminShell,
});
