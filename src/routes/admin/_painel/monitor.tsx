import { createFileRoute } from "@tanstack/react-router";

import { MonitorWorkspace } from "@/components/admin/MonitorWorkspace";

export const Route = createFileRoute("/admin/_painel/monitor")({
  head: () => ({ meta: [{ title: "Monitor — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: MonitorWorkspace,
});
