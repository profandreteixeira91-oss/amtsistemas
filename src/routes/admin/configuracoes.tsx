import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/configuracoes")({ component: () => <AdminModulePage title="Configurações" eyebrow="Control Center" description="Configurações gerais do ambiente administrativo, perfis, preferências e integrações." icon={Settings} /> });
