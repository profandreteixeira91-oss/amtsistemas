import { createFileRoute } from "@tanstack/react-router";

import { AuditWorkspace } from "@/components/admin/AuditWorkspace";

export const Route = createFileRoute("/admin/_painel/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AuditWorkspace,
});
