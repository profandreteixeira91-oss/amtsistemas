import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  BookOpen,
  BookMarked,
  Package,
  Users,
  Wallet,
  ChefHat,
  BarChart3,
  Building2,
  Sparkles,
  Truck,
  ShoppingCart,
  UserCog,
  NotebookText,

} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEmpresa } from "@/contexts/empresa-context";
import { canAccess } from "@/lib/permissions";
import amtLogo from "@/assets/amt-restaurant-logo.png.asset.json";
import amtSistemasLogo from "@/assets/amt-sistemas-logo.png.asset.json";

const grupos = [
  {
    label: "Operação",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Mesas", url: "/mesas", icon: UtensilsCrossed },
      { title: "Comandas", url: "/comandas", icon: ClipboardList },
      { title: "Cozinha (KDS)", url: "/cozinha", icon: ChefHat },
      { title: "Receitas", url: "/receitas", icon: NotebookText },
      { title: "Caixa", url: "/caixa", icon: Wallet },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Cardápio", url: "/cardapio", icon: BookOpen },
      { title: "Ficha Técnica", url: "/ficha-tecnica", icon: BookMarked },
      { title: "Estoque", url: "/estoque", icon: Package },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Promoções", url: "/promocoes", icon: Sparkles },
    ],
  },
  {
    label: "Compras",
    items: [
      { title: "Comparativo", url: "/compras/comparativo", icon: BarChart3 },
      { title: "Pedidos", url: "/compras/pedidos", icon: ShoppingCart },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Colaboradores", url: "/colaboradores", icon: UserCog },
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "IA · Insights", url: "/ia", icon: Sparkles },
      { title: "Empresas", url: "/empresas", icon: Building2 },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { empresaAtual, roleAtual } = useEmpresa();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <img src={amtLogo.url} alt="AMT Restaurant" className="h-9 w-9 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold leading-tight">AMT Restaurant</span>
              <span className="truncate text-xs text-muted-foreground">
                {empresaAtual?.nome_fantasia ?? "Nenhuma empresa"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {grupos.map((g) => {
          const items = g.items.filter((it) => canAccess(roleAtual, it.url));
          if (items.length === 0) return null;
          return (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex flex-col items-center gap-1 px-2 py-2 text-center">
            <img
              src={amtSistemasLogo.url}
              alt="AMT Sistemas e Soluções"
              className="h-8 w-auto opacity-90"
            />
            <span className="text-[10px] leading-tight text-muted-foreground">
              Desenvolvido por AMT Sistemas e Soluções
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground/70">
              AMT Restaurant · v1.0
            </span>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <img src={amtSistemasLogo.url} alt="AMT" className="h-6 w-6 object-contain" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
