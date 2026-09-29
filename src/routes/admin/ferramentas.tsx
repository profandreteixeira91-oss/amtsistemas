import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
export const Route = createFileRoute("/admin/ferramentas")({ component: () => <AdminModulePage title="Ferramentas" eyebrow="Infraestrutura" description="Acessos rápidos para GitHub, Supabase, Cloudflare, domínios, deploys e outros serviços da operação." icon={Wrench} /> });
