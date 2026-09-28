import { useNavigate } from "@tanstack/react-router";
import { Building2, ChevronsUpDown, LogOut, User as UserIcon, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa, type AppRole } from "@/contexts/empresa-context";
import { useEmpresaLogo } from "@/hooks/use-empresa-logo";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  gerencia: "Gerência",
  garcom: "Garçom",
  caixa: "Caixa",
  cozinha: "Cozinha",
};

export function AppHeader() {
  const { user } = useAuth();
  const { empresaAtual, roleAtual, memberships, trocarEmpresa } = useEmpresa();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logoUrl = useEmpresaLogo(empresaAtual?.logo_url);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/crm", replace: true });
  }

  const iniciais = (user?.email ?? "?").slice(0, 2).toUpperCase();
  const nomeRest = empresaAtual?.nome_fantasia ?? "Selecione uma empresa";
  const iniciaisEmp = nomeRest.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Minhas empresas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {memberships.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              Você ainda não pertence a nenhuma empresa.
            </div>
          ) : (
            memberships.map((m) => (
              <DropdownMenuItem
                key={m.empresa.id}
                onClick={() => trocarEmpresa(m.empresa.id)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm">{m.empresa.nome_fantasia}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabels[m.role]}
                  </span>
                </div>
                {empresaAtual?.id === m.empresa.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/crm/empresas" })}>
            <Building2 className="h-4 w-4" /> Gerenciar empresas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Identidade do restaurante em destaque (canto superior direito) */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5">
          <Avatar className="h-10 w-10 rounded-md bg-white">
            {logoUrl && <AvatarImage src={logoUrl} alt={nomeRest} className="object-contain" />}
            <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xs font-semibold">
              {iniciaisEmp}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-end leading-tight">
            <span className="max-w-[220px] truncate text-sm font-semibold text-foreground">
              {nomeRest}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              AMT Restaurant
            </span>
          </div>
          {roleAtual && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {roleLabels[roleAtual]}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {iniciais}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserIcon className="h-4 w-4" /> Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={sair} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
