import type { AppRole } from "@/contexts/empresa-context";

// Rotas permitidas por papel. Admin e gerência acessam tudo (null = sem restrição).
const ROLE_ROUTES: Record<AppRole, string[] | null> = {
  admin: null,
  gerencia: null,
  garcom: ["/mesas", "/cardapio", "/comandas"],
  caixa: ["/caixa"],
  cozinha: ["/cozinha", "/receitas"],
};

const ROLE_HOME: Record<AppRole, string> = {
  admin: "/dashboard",
  gerencia: "/dashboard",
  garcom: "/mesas",
  caixa: "/caixa",
  cozinha: "/cozinha",
};

export function isFullAccess(role: AppRole | null): boolean {
  return role === "admin" || role === "gerencia";
}

export function allowedPaths(role: AppRole | null): string[] | null {
  if (!role) return [];
  return ROLE_ROUTES[role];
}

export function defaultPathFor(role: AppRole | null): string {
  if (!role) return "/dashboard";
  return ROLE_HOME[role];
}

export function canAccess(role: AppRole | null, pathname: string): boolean {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role];
  if (allowed === null) return true;
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
