import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, RefreshCw, Search, ExternalLink, Copy, Eye, Users, MousePointerClick,
  LayoutTemplate, CheckCircle2, FileText, Archive,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/crm/landing-pages")({
  component: LandingPagesAdmin,
});

type LP = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  headline: string | null;
  subheadline: string | null;
  cta_texto: string | null;
  cta_url: string | null;
  cor_primaria: string | null;
  imagem_hero: string | null;
  status: string;
  campanha_id: string | null;
  sistema_id: string | null;
  visualizacoes: number;
  conversoes: number;
  seo_titulo: string | null;
  seo_descricao: string | null;
  publicada_em: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  landing_page_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  empresa: string | null;
  mensagem: string | null;
  created_at: string;
};

type Ref = { id: string; nome: string };

const STATUS = [
  { value: "rascunho", label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  { value: "publicada", label: "Publicada", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
  { value: "arquivada", label: "Arquivada", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300", icon: Archive },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function emptyLP(): Partial<LP> {
  return {
    slug: "",
    titulo: "",
    descricao: "",
    headline: "",
    subheadline: "",
    cta_texto: "Fale conosco",
    cta_url: "",
    cor_primaria: "#6366f1",
    imagem_hero: "",
    status: "rascunho",
    campanha_id: null,
    sistema_id: null,
    seo_titulo: "",
    seo_descricao: "",
  };
}

function statusBadge(v: string) {
  const s = STATUS.find((x) => x.value === v) ?? STATUS[0];
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${s.color}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}

function LandingPagesAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tab, setTab] = useState<"paginas" | "leads">("paginas");
  const [editing, setEditing] = useState<Partial<LP> | null>(null);
  const [open, setOpen] = useState(false);

  const pagesQ = useQuery<LP[]>({
    queryKey: ["manager_landing_pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_landing_pages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LP[];
    },
  });

  const leadsQ = useQuery<Lead[]>({
    queryKey: ["manager_landing_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_landing_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const campsQ = useQuery<Ref[]>({
    queryKey: ["ref_campanhas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_campanhas").select("id,nome").order("nome");
      if (error) throw error;
      return (data ?? []) as Ref[];
    },
  });

  const sistemasQ = useQuery<Ref[]>({
    queryKey: ["ref_sistemas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_sistemas").select("id,nome").order("nome");
      if (error) throw error;
      return (data ?? []) as Ref[];
    },
  });

  const save = useMutation({
    mutationFn: async (payload: Partial<LP>) => {
      const body = {
        slug: payload.slug || slugify(payload.titulo ?? ""),
        titulo: payload.titulo ?? "",
        descricao: payload.descricao || null,
        headline: payload.headline || null,
        subheadline: payload.subheadline || null,
        cta_texto: payload.cta_texto || null,
        cta_url: payload.cta_url || null,
        cor_primaria: payload.cor_primaria || "#6366f1",
        imagem_hero: payload.imagem_hero || null,
        status: payload.status || "rascunho",
        campanha_id: payload.campanha_id || null,
        sistema_id: payload.sistema_id || null,
        seo_titulo: payload.seo_titulo || null,
        seo_descricao: payload.seo_descricao || null,
        publicada_em: payload.status === "publicada" ? new Date().toISOString() : null,
      };
      if (payload.id) {
        const { error } = await supabase.from("manager_landing_pages").update(body).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("manager_landing_pages").insert(body);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Landing page salva");
      qc.invalidateQueries({ queryKey: ["manager_landing_pages"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("manager_landing_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Landing page removida");
      qc.invalidateQueries({ queryKey: ["manager_landing_pages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch = { status, publicada_em: status === "publicada" ? new Date().toISOString() : null };
      const { error } = await supabase.from("manager_landing_pages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manager_landing_pages"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const pages = pagesQ.data ?? [];
  const leads = leadsQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pages.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.titulo.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.headline ?? "").toLowerCase().includes(q)
      );
    });
  }, [pages, search, statusFilter]);

  const kpis = useMemo(() => {
    const total = pages.length;
    const publicadas = pages.filter((p) => p.status === "publicada").length;
    const views = pages.reduce((s, p) => s + (p.visualizacoes ?? 0), 0);
    const conv = pages.reduce((s, p) => s + (p.conversoes ?? 0), 0);
    const rate = views > 0 ? (conv / views) * 100 : 0;
    return { total, publicadas, views, conv, rate };
  }, [pages]);

  const openNew = () => {
    setEditing(emptyLP());
    setOpen(true);
  };
  const openEdit = (p: LP) => {
    setEditing({ ...p });
    setOpen(true);
  };

  const publicUrl = (slug: string) => `${window.location.origin}/lp/${slug}`;

  const copyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(publicUrl(slug));
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" /> Landing Pages
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie, publique e monitore páginas de captura vinculadas às suas campanhas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { pagesQ.refetch(); leadsQ.refetch(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nova landing page
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total" value={kpis.total} icon={LayoutTemplate} />
        <KpiCard label="Publicadas" value={kpis.publicadas} icon={CheckCircle2} />
        <KpiCard label="Visualizações" value={kpis.views.toLocaleString("pt-BR")} icon={Eye} />
        <KpiCard label="Conversões" value={kpis.conv.toLocaleString("pt-BR")} icon={MousePointerClick} />
        <KpiCard label="Taxa de conversão" value={`${kpis.rate.toFixed(1)}%`} icon={Users} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "paginas" | "leads")}>
        <TabsList>
          <TabsTrigger value="paginas">Páginas</TabsTrigger>
          <TabsTrigger value="leads">Leads capturados ({leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="paginas" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por título, slug ou headline" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {pagesQ.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma landing page encontrada.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const leadCount = leads.filter((l) => l.landing_page_id === p.id).length;
                return (
                  <Card key={p.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{p.titulo}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate mt-1">/lp/{p.slug}</p>
                        </div>
                        {statusBadge(p.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col">
                      {p.headline && <p className="text-sm line-clamp-2">{p.headline}</p>}
                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                        <Stat label="Views" value={p.visualizacoes} />
                        <Stat label="Conv." value={p.conversoes} />
                        <Stat label="Leads" value={leadCount} />
                      </div>
                      <div className="flex gap-1 mt-auto pt-2 flex-wrap">
                        <Select value={p.status} onValueChange={(s) => updateStatus.mutate({ id: p.id, status: s })}>
                          <SelectTrigger className="h-8 text-xs flex-1 min-w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Abrir" asChild>
                          <a href={publicUrl(p.slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Copiar link" onClick={() => copyLink(p.slug)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover landing page?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação é permanente e apagará os leads capturados.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del.mutate(p.id)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {leadsQ.isLoading ? (
            <Skeleton className="h-64" />
          ) : leads.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum lead capturado ainda.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="p-3 font-medium">Nome</th>
                        <th className="p-3 font-medium">Contato</th>
                        <th className="p-3 font-medium">Empresa</th>
                        <th className="p-3 font-medium">Página</th>
                        <th className="p-3 font-medium">Recebido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => {
                        const page = pages.find((p) => p.id === l.landing_page_id);
                        return (
                          <tr key={l.id} className="border-t">
                            <td className="p-3">{l.nome ?? "—"}</td>
                            <td className="p-3">
                              <div>{l.email ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{l.telefone ?? ""}</div>
                            </td>
                            <td className="p-3">{l.empresa ?? "—"}</td>
                            <td className="p-3">
                              {page ? (
                                <Link to="/crm/landing-pages" className="text-primary hover:underline">{page.titulo}</Link>
                              ) : "—"}
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar landing page" : "Nova landing page"}</DialogTitle>
            <DialogDescription>Configure conteúdo, CTA e SEO da página.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Título *">
                  <Input
                    value={editing.titulo ?? ""}
                    onChange={(e) => {
                      const titulo = e.target.value;
                      setEditing((s) => ({
                        ...s!,
                        titulo,
                        slug: s?.slug && s.id ? s.slug : slugify(titulo),
                      }));
                    }}
                  />
                </Field>
                <Field label="Slug (URL) *">
                  <Input value={editing.slug ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, slug: slugify(e.target.value) }))} />
                </Field>
              </div>
              <Field label="Descrição interna">
                <Textarea rows={2} value={editing.descricao ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, descricao: e.target.value }))} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Headline">
                  <Input value={editing.headline ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, headline: e.target.value }))} />
                </Field>
                <Field label="Subheadline">
                  <Input value={editing.subheadline ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, subheadline: e.target.value }))} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Texto do CTA">
                  <Input value={editing.cta_texto ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, cta_texto: e.target.value }))} />
                </Field>
                <Field label="URL do CTA (opcional)">
                  <Input placeholder="https://..." value={editing.cta_url ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, cta_url: e.target.value }))} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Cor primária">
                  <Input type="color" value={editing.cor_primaria ?? "#6366f1"} onChange={(e) => setEditing((s) => ({ ...s!, cor_primaria: e.target.value }))} />
                </Field>
                <Field label="Status">
                  <Select value={editing.status ?? "rascunho"} onValueChange={(v) => setEditing((s) => ({ ...s!, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Imagem hero (URL)">
                  <Input placeholder="https://..." value={editing.imagem_hero ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, imagem_hero: e.target.value }))} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Campanha vinculada">
                  <Select value={editing.campanha_id ?? "none"} onValueChange={(v) => setEditing((s) => ({ ...s!, campanha_id: v === "none" ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {(campsQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sistema vinculado">
                  <Select value={editing.sistema_id ?? "none"} onValueChange={(v) => setEditing((s) => ({ ...s!, sistema_id: v === "none" ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(sistemasQ.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="SEO título">
                  <Input value={editing.seo_titulo ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, seo_titulo: e.target.value }))} />
                </Field>
                <Field label="SEO descrição">
                  <Input value={editing.seo_descricao ?? ""} onChange={(e) => setEditing((s) => ({ ...s!, seo_descricao: e.target.value }))} />
                </Field>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={save.isPending || !editing?.titulo || !editing?.slug}
              onClick={() => editing && save.mutate(editing)}
            >
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value.toLocaleString("pt-BR")}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
