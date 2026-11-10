import { Activity, Boxes, Code2, FileText, LayoutDashboard, MessageCircle, Users, Wrench } from "lucide-react";

import type { IconType } from "@/lib/admin/systems";

// Módulos do Control Center (/admin): menu lateral, menu do celular, título do cabeçalho e atalhos do dashboard.

export type AdminModule = {
  label: string;
  to: "/admin" | "/admin/sistemas" | "/admin/whatsapp" | "/admin/leads" | "/admin/formularios" | "/admin/ferramentas" | "/admin/auditoria" | "/admin/desenvolvimento";
  icon: IconType;
};

export const ADMIN_MODULES: AdminModule[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Sistemas", to: "/admin/sistemas", icon: Boxes },
  { label: "WhatsApp", to: "/admin/whatsapp", icon: MessageCircle },
  { label: "Leads", to: "/admin/leads", icon: Users },
  { label: "Formulários", to: "/admin/formularios", icon: FileText },
  { label: "Ferramentas", to: "/admin/ferramentas", icon: Wrench },
  { label: "Auditoria", to: "/admin/auditoria", icon: Activity },
  { label: "Desenvolvimento", to: "/admin/desenvolvimento", icon: Code2 },
];

/** Módulo da rota atual (o Dashboard só na raiz). */
export function moduleForPath(pathname: string): AdminModule {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  return ADMIN_MODULES.find((m) => m.to !== "/admin" && (path === m.to || path.startsWith(`${m.to}/`))) ?? ADMIN_MODULES[0];
}

/** Atalhos do dashboard: rótulo do módulo → endereço. */
export function modulePath(label: string): AdminModule["to"] {
  return ADMIN_MODULES.find((m) => m.label === label)?.to ?? "/admin";
}
