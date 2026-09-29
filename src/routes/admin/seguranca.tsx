import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/seguranca")({ component: () => <AdminModulePage title="Segurança" eyebrow="Proteção operacional" description="Painel para autenticação, autorização, RLS, secrets, sessões, domínios e alertas de segurança." icon={ShieldCheck} /> });
