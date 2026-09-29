import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/auditoria")({ component: () => <AdminModulePage title="Auditoria" eyebrow="Rastreabilidade" description="Registre acessos administrativos, alterações críticas, integrações e eventos relevantes da plataforma." icon={Activity} /> });
