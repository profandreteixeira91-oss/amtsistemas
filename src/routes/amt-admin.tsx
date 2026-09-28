import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutDashboard, Boxes, Package, Sparkles, Puzzle, Users, RefreshCcw, ShieldAlert, FileClock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/amt-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/amt-admin/sistemas", label: "Sistemas", icon: Boxes },
  { to: "/amt-admin/planos", label: "Planos & Preços", icon: Package },
  { to: "/amt-admin/comercial", label: "Landing / Comercial", icon: Sparkles },
  
  { to: "/amt-admin/modulos", label: "Módulos", icon: Puzzle },
  { to: "/amt-admin/clientes", label: "Clientes & Assinaturas", icon: Users },
  { to: "/amt-admin/asaas", label: "Asaas / Fila", icon: RefreshCcw },
  { to: "/amt-admin/auditoria", label: "Auditoria", icon: FileClock },
  { to: "/amt-admin/seguranca", label: "Segurança", icon: ShieldAlert },
];

function AmtAdminLayout() {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/crm" });
        return;
      }
      const { data } = await supabase.rpc("is_super_admin" as any, { _user_id: sess.session.user.id });
      setState(data === true ? "ok" : "denied");
    })();
  }, [navigate]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <div className="text-lg font-semibold">Área restrita</div>
        <div className="text-sm text-muted-foreground">Sua conta não possui privilégios de Super Admin.</div>
        <Button asChild variant="outline"><Link to="/">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/20">
      <aside className="w-64 shrink-0 border-r bg-background flex flex-col">
        <div className="px-5 py-4 border-b">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">AMT</div>
          <div className="text-lg font-bold">Master Admin</div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          <Button asChild variant="outline" size="sm" className="w-full justify-start">
            <Link to="/crm"><LogOut className="h-4 w-4 mr-2 rotate-180" />Ir para CRM</Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createFileRoute("/amt-admin")({
  head: () => ({ meta: [{ title: "AMT Master Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AmtAdminLayout,
});
