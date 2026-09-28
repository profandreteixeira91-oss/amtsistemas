import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Radar, Sparkles, Building2, KanbanSquare, Calendar,
  MessageCircle, Mail, Instagram, Megaphone, Workflow, FileText, ScrollText,
  Users, ClipboardCheck, Wallet, BarChart3, Zap, Cog, ChevronRight, LogOut, Shield, Command as CommandIcon, Search, Radio, KeyRound, Bell, ImageIcon, Globe, FileSignature, Receipt, LayoutTemplate, BedDouble, ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; external?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Visão", items: [
    { title: "Dashboard", url: "/crm", icon: LayoutDashboard },
    { title: "Alertas", url: "/crm/alertas", icon: Bell },
  ]},
  { label: "Prospecção", items: [
    { title: "Lead Scraper", url: "/crm/lead-scraper", icon: Radar },
    { title: "Leads", url: "/crm/leads", icon: Sparkles },
    { title: "Empresas", url: "/crm/empresas", icon: Building2 },
    { title: "Oportunidades", url: "/crm/oportunidades", icon: KanbanSquare },
    { title: "Pipeline", url: "/crm/pipeline", icon: KanbanSquare },
    { title: "Agenda", url: "/crm/agenda", icon: Calendar },
  ]},
  { label: "Comunicação", items: [
    { title: "Mensagens Comerciais", url: "/crm/mensagens-comerciais", icon: Sparkles },
    { title: "Mensagens", url: "/crm/mensagens", icon: MessageCircle },
    { title: "WhatsApp", url: "/crm/whatsapp", icon: MessageCircle },
    { title: "Email", url: "/crm/email", icon: Mail },
    { title: "Instagram", url: "/crm/instagram", icon: Instagram },
    { title: "Canais", url: "/crm/canais", icon: Radio },
  ]},
  { label: "Marketing", items: [
    { title: "Marketing IA", url: "/crm/marketing", icon: Megaphone },
    { title: "Landing Pages", url: "/crm/landing-pages", icon: LayoutTemplate },
    { title: "Sequências", url: "/crm/sequencias", icon: Workflow },
    { title: "Templates", url: "/crm/templates", icon: FileText },
    { title: "Imagens IA", url: "/crm/ia-imagens", icon: ImageIcon },
  ]},
  { label: "Fechamento", items: [
    { title: "Propostas", url: "/crm/propostas", icon: FileText },
    { title: "Contratos", url: "/crm/contratos", icon: ScrollText },
    { title: "Portal Cliente", url: "/crm/portal", icon: Globe },
    { title: "Assinaturas", url: "/crm/assinaturas", icon: FileSignature },
  ]},
  { label: "Cliente", items: [
    { title: "Clientes", url: "/crm/clientes", icon: Users },
    { title: "Pós-venda", url: "/crm/pos-venda", icon: ClipboardCheck },
    { title: "Financeiro", url: "/crm/financeiro", icon: Wallet },
    { title: "Contas & Fluxo", url: "/crm/contas", icon: Receipt },
  ]},
  { label: "Sistemas Clientes", items: [
    { title: "AMT Hotel", url: "https://hotel.amtsistemas.com.br", icon: BedDouble, external: true },
  ]},
  { label: "Sistema", items: [
    { title: "Relatórios", url: "/crm/relatorios", icon: BarChart3 },
    { title: "Automações", url: "/crm/automacoes", icon: Zap },
    { title: "Workflows", url: "/crm/workflows", icon: Workflow },
    { title: "Integrações", url: "/crm/integracoes", icon: KeyRound },
    { title: "Configurações", url: "/crm/configuracoes", icon: Cog },
  ]},
];

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; user: User }
  | { status: "ok"; user: User };

function useCrmAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    async function check(user: User | null) {
      if (!user) { if (alive) setState({ status: "unauthenticated" }); return; }
      const { data, error } = await supabase.rpc("is_super_admin", { _user_id: user.id });
      if (!alive) return;
      if (error) { setState({ status: "forbidden", user }); return; }
      setState(data ? { status: "ok", user } : { status: "forbidden", user });
    }
    supabase.auth.getUser().then(({ data }) => check(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => check(session?.user ?? null));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  return state;
}

function AlertBell() {
  const q = useQuery({
    queryKey: ["crm_alertas_count"],
    queryFn: async () => {
      const { count } = await supabase.from("crm_alertas").select("id", { count: "exact", head: true }).eq("lido", false);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
  const n = q.data ?? 0;
  return (
    <Link to="/crm/alertas" className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
      <Bell className="h-4 w-4" />
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}


function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-8 text-center shadow-2xl backdrop-blur">
        {children}
      </div>
    </div>
  );
}

function LoginForm({ onCancel }: { onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Autenticado");
  }
  return (
    <GateShell>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <Shield className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">AMT CRM</h1>
      <p className="mt-2 text-sm text-muted-foreground">Acesso restrito ao time comercial.</p>
      <form className="mt-6 space-y-3 text-left" onSubmit={submit}>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Senha</label>
          <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-primary/40 focus:ring-2" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Autenticando…" : "Entrar no CRM"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>Voltar ao site</Button>
      </form>
    </GateShell>
  );
}

function CrmGate() {
  const auth = useCrmAuth();
  const navigate = useNavigate();
  if (auth.status === "loading") return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
  if (auth.status === "unauthenticated") return <LoginForm onCancel={() => navigate({ to: "/" })} />;
  if (auth.status === "forbidden") return (
    <GateShell>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <Shield className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold">Acesso negado</h1>
      <p className="mt-2 text-sm text-muted-foreground">{auth.user.email} não possui permissão de super administrador.</p>
      <Button variant="outline" className="mt-6 w-full" onClick={async () => { await supabase.auth.signOut(); }}>
        <LogOut className="mr-2 h-4 w-4" /> Sair
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate({ to: "/" })}>Voltar ao site</Button>
    </GateShell>
  );
  return <CrmShell user={auth.user} />;
}

function CrmShell({ user }: { user: User }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function sair() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut(); router.invalidate();
  }

  const isActive = (url: string) => url === "/crm" ? pathname === "/crm" : pathname === url || pathname.startsWith(url + "/");
  const iniciais = (user.email ?? "?").slice(0, 2).toUpperCase();
  const crumbs = pathname.replace(/^\/crm\/?/, "").split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link to="/crm" className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground ring-1 ring-primary/30">
              <span className="text-xs font-black tracking-tighter">CRM</span>
            </div>
            <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">AMT CRM</span>
              <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">Comercial</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {NAV.map((g) => (
            <SidebarGroup key={g.label}>
              <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {g.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={!item.external && isActive(item.url)} tooltip={item.title}>
                        {item.external ? (
                          <a href={item.url} target="_blank" rel="noreferrer">
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{item.title}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        ) : (
                          <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            IA online · Gemini free
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-3 backdrop-blur-xl">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/crm" className="hover:text-foreground">CRM</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <span className="capitalize text-foreground">{c.replace(/-/g, " ")}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AlertBell />
            <button onClick={() => setCmdOpen(true)}
              className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted md:inline-flex">
              <Search className="h-3.5 w-3.5" /><span>Pesquisar…</span>
              <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                <CommandIcon className="h-2.5 w-2.5" />K
              </kbd>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">{iniciais}</AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start leading-tight md:flex">
                    <span className="text-xs font-medium">{user.email}</span>
                    <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase tracking-wider">Comercial</Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate({ to: "/" })}>Ir para o site</DropdownMenuItem>
                <DropdownMenuItem onClick={sair} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Buscar módulos…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          {NAV.map((g) => (
            <CommandGroup key={g.label} heading={g.label}>
              {g.items.map((item) => (
                <CommandItem key={item.url} value={item.title} onSelect={() => { setCmdOpen(false); if (item.external) window.open(item.url, "_blank", "noreferrer"); else navigate({ to: item.url }); }}>
                  <item.icon className="h-4 w-4" />{item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/crm")({
  ssr: false,
  head: () => ({ meta: [{ title: "AMT CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CrmGate,
});
