import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/sistemas")({ component: () => <AdminModulePage title="Sistemas" eyebrow="Projetos e plataformas" description="Centralize seus produtos, sites, integrações e acessos externos em um único lugar." icon={Boxes} /> });
