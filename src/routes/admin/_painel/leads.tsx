import { createFileRoute } from "@tanstack/react-router";

import { LeadsWorkspace } from "@/components/admin/LeadsWorkspace";

export const Route = createFileRoute("/admin/_painel/leads")({
  head: () => ({ meta: [{ title: "Leads — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: LeadsWorkspace,
});
