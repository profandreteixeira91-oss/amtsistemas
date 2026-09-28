import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, UtensilsCrossed, BookOpen, ChefHat, Wallet, ClipboardList } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa, type AppRole } from "@/contexts/empresa-context";
import { supabase } from "@/integrations/supabase/client";
import { allowedPaths } from "@/lib/permissions";
import amtLogo from "@/assets/amt-restaurant-logo.png.asset.json";

const iconFor: Record<string, typeof UtensilsCrossed> = {
  "/mesas": UtensilsCrossed,
  "/cardapio": BookOpen,
  "/cozinha": ChefHat,
  "/caixa": Wallet,
  "/comandas": ClipboardList,
};

const labelFor: Record<string, string> = {
  "/mesas": "Mesas",
  "/cardapio": "Cardápio",
  "/cozinha": "Cozinha",
  "/caixa": "Caixa",
  "/comandas": "Comandas",
};

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  gerencia: "Gerência",
  garcom: "Garçom",
  caixa: "Caixa",
  cozinha: "Cozinha",
};

export function FocusShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { empresaAtual, roleAtual } = useEmpresa();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const paths = allowedPaths(roleAtual) ?? [];
  const showNav = paths.length > 1;

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/crm", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-white">
            <img src={amtLogo.url} alt="AMT" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{empresaAtual?.nome_fantasia ?? "AMT Restaurant"}</span>
            <span className="text-[11px] text-muted-foreground">
              {roleAtual ? roleLabels[roleAtual] : ""} · {user?.email}
            </span>
          </div>
        </div>

        {showNav && (
          <nav className="hidden gap-1 sm:flex">
            {paths.map((p) => {
              const Icon = iconFor[p] ?? ClipboardList;
              const active = pathname === p || pathname.startsWith(p + "/");
              return (
                <Link
                  key={p}
                  to={p}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {labelFor[p] ?? p}
                </Link>
              );
            })}
          </nav>
        )}

        <Button variant="ghost" size="sm" onClick={sair}>
          <LogOut className="mr-2 h-4 w-4" />Sair
        </Button>
      </header>

      {showNav && (
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background/60 px-2 py-2 sm:hidden">
          {paths.map((p) => {
            const Icon = iconFor[p] ?? ClipboardList;
            const active = pathname === p || pathname.startsWith(p + "/");
            return (
              <Link
                key={p}
                to={p}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {labelFor[p] ?? p}
              </Link>
            );
          })}
        </nav>
      )}

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
