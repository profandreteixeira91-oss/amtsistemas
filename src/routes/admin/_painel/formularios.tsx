import { createFileRoute } from "@tanstack/react-router";

import { FormsWorkspace } from "@/components/admin/FormsWorkspace";

export const Route = createFileRoute("/admin/_painel/formularios")({
  head: () => ({ meta: [{ title: "Formulários — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: FormsWorkspace,
});
