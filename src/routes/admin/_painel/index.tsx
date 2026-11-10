import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { modulePath } from "@/lib/admin/modules";

export const Route = createFileRoute("/admin/_painel/")({
  head: () => ({ meta: [{ title: "Dashboard — Control Center AMT" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  return <DashboardOverview onOpen={(label) => void navigate({ to: modulePath(label) })} />;
}
