import { createFileRoute } from "@tanstack/react-router";

import { DevelopmentModuleWorkspace } from "@/components/admin/DevelopmentModule";

export const Route = createFileRoute("/admin/_painel/desenvolvimento")({
  head: () => ({ meta: [{ title: "Desenvolvimento — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: DevelopmentModuleWorkspace,
});
