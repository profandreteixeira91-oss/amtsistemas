import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";

// Layout dos módulos do Control Center (sem segmento na URL): menu lateral e verificação da sessão.
export const Route = createFileRoute("/admin/_painel")({
  // App instalável do Control Center (Tela de Início no celular): necessário para os alertas no iPhone.
  head: () => ({
    links: [
      { rel: "manifest", href: "/admin.webmanifest" },
      { rel: "apple-touch-icon", href: "/admin/icon-192.png" },
    ],
    meta: [{ name: "theme-color", content: "#020617" }, { name: "apple-mobile-web-app-capable", content: "yes" }],
  }),
  component: AdminShell,
});
