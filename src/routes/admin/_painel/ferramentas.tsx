import { createFileRoute } from "@tanstack/react-router";

import { ToolsWorkspace } from "@/components/admin/ToolsWorkspace";

export const Route = createFileRoute("/admin/_painel/ferramentas")({
  head: () => ({ meta: [{ title: "Ferramentas — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ToolsWorkspace,
});
