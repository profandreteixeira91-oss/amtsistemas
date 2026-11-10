import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo (página-modelo): segue para o dashboard do Control Center.
export const Route = createFileRoute("/admin/seguranca")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
