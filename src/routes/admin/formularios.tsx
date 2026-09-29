import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/formularios")({ component: () => <AdminModulePage title="Formulários" eyebrow="Captação" description="Visualize os formulários enviados pelos sites e acompanhe a origem e o contexto de cada solicitação." icon={FileText} /> });
