import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/leads")({ component: () => <AdminModulePage title="Leads" eyebrow="Comercial" description="Acompanhe os contatos recebidos pelo site e organize o pipeline comercial da AMT Sistemas." icon={Users} /> });
