import { createFileRoute } from "@tanstack/react-router";

import { VisitsWorkspace } from "@/components/admin/VisitsWorkspace";

export const Route = createFileRoute("/admin/_painel/visitas")({
  head: () => ({
    meta: [
      { title: "Visitas — Control Center AMT" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VisitsWorkspace,
});
