import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";

import { AdminAlerts } from "@/components/admin/AdminAlerts";
import { Button } from "@/components/ui/button";
import { useAdminCounters } from "@/lib/admin/counters";
import { ADMIN_MODULES, moduleForPath } from "@/lib/admin/modules";
import { getAdminProfile, getAdminSession, signOutAdmin } from "@/lib/amt-admin-auth";

// Casca do Control Center (/admin): confere a sessão uma vez e mantém o menu enquanto se navega entre os módulos,
// cada um com o próprio endereço (/admin/whatsapp, /admin/sistemas...).

const COLLAPSED_KEY = "amt-admin-menu-collapsed";

export function AdminShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = moduleForPath(pathname);
  const counters = useAdminCounters();
  const badge = (to: string) => (to === "/admin/whatsapp" ? counters.whatsapp : to === "/admin/leads" ? counters.leads : 0);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // sem armazenamento: o menu começa aberto
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getAdminSession()
      .then(async (session) => {
        if (!active) return;
        if (!session) {
          navigate({ to: "/admin/login" });
          return;
        }
        const profile = await getAdminProfile(session.user.id);
        if (!profile) {
          await signOutAdmin();
          navigate({ to: "/admin/login" });
          return;
        }
        setUserEmail(profile.email);
        setLoading(false);
      })
      .catch(async (error) => {
        console.error(error);
        await signOutAdmin().catch(() => undefined);
        if (active) navigate({ to: "/admin/login" });
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  function toggleMenu() {
    setSidebarCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        // preferência só nesta visita
      }
      return !value;
    });
  }

  async function handleLogout() {
    await signOutAdmin();
    navigate({ to: "/admin/login" });
  }

  if (loading) {
    return <div className="amt-admin flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">Validando sessão...</div>;
  }

  return (
    <main className="amt-admin min-h-screen bg-white text-slate-950">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-20" : "w-72"}`}>
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <img src="/amt-sistemas-logo.png" alt="AMT Sistemas" className="h-9 w-9 object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="font-semibold">AMT Sistemas</p>
                <p className="text-[11px] text-slate-400">Control Center</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {ADMIN_MODULES.map((item) => {
              const Icon = item.icon;
              const active = current.to === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex w-full items-center rounded-xl text-left text-sm transition-colors ${sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"} ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className="relative">
                    <Icon className="h-4 w-4 shrink-0" />
                    {sidebarCollapsed && badge(item.to) ? <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
                  </span>
                  {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                  {!sidebarCollapsed && badge(item.to) ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{badge(item.to)}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            {!sidebarCollapsed && <div className="mb-3 rounded-xl bg-white/5 p-3"><p className="truncate text-xs text-slate-300">{userEmail}</p><p className="mt-1 text-[11px] text-slate-500">Sessão administrativa</p></div>}
            <Button variant="ghost" onClick={handleLogout} className={`w-full gap-2 text-slate-300 hover:bg-white/10 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "justify-start"}`} title="Sair"><LogOut className="h-4 w-4" />{!sidebarCollapsed && "Sair"}</Button>
            <Button variant="ghost" onClick={toggleMenu} className={`mt-1 w-full gap-2 text-slate-400 hover:bg-white/10 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "justify-start"}`} title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}>
              {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              {!sidebarCollapsed && "Minimizar menu"}
            </Button>
          </div>
        </aside>

        <section className={`min-w-0 flex-1 transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
          <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">Operação</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{current.label}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">Sistema operacional</span>
              <AdminAlerts />
              <Button size="sm" variant="outline" onClick={handleLogout} className="gap-2 lg:hidden">
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
            {ADMIN_MODULES.map((item) => (
              <Link key={item.to} to={item.to} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${current.to === item.to ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {item.label}
                {badge(item.to) ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{badge(item.to)}</span> : null}
              </Link>
            ))}
          </nav>

          <div className="space-y-8 p-5 sm:p-8">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}
