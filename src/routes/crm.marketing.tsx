import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { iaGerarPost } from "@/lib/crm/ai-service.functions";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Instagram, Megaphone } from "lucide-react";

export const Route = createFileRoute("/crm/marketing")({
  head: () => ({ meta: [{ title: "Marketing IA · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: MarketingPage,
});

type Conteudo = { id: string; formato: string; titulo: string | null; legenda: string | null; hashtags: string | null; cta: string | null; status: string; created_at: string };

function MarketingPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [ia, setIa] = useState<{ formato: string; tema: string }>({ formato: "feed", tema: "" });
  const [form, setForm] = useState({ formato: "feed", titulo: "", legenda: "", hashtags: "", cta: "" });
  const gerar = useServerFn(iaGerarPost);

  const q = useQuery({
    queryKey: ["crm_conteudos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_conteudos").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Conteudo[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.titulo) throw new Error("Título obrigatório");
      const { error } = await supabase.from("crm_conteudos").insert({ ...form, status: "rascunho" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Conteúdo criado"); setOpen(false); setForm({ formato: "feed", titulo: "", legenda: "", hashtags: "", cta: "" }); qc.invalidateQueries({ queryKey: ["crm_conteudos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const gerarIA = useMutation({
    mutationFn: async () => {
      if (!ia.tema) throw new Error("Informe um tema");
      const r = await gerar({ data: ia as any });
      let parsed: any = {};
      try { parsed = JSON.parse((r as any).content); } catch { parsed = { legenda: (r as any).content }; }
      setForm({
        formato: ia.formato,
        titulo: parsed.titulo || ia.tema,
        legenda: parsed.legenda || "",
        hashtags: parsed.hashtags || "",
        cta: parsed.cta || "",
      });
      setOpen(true);
    },
    onError: (e: Error) => toast.error(e.message),
    onSuccess: () => toast.success("Conteúdo gerado pela IA"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketing IA</h1>
          <p className="text-sm text-muted-foreground">Calendário de conteúdo Instagram + campanhas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/crm/instagram"><Instagram className="mr-2 h-4 w-4" />Ir para Instagram IA</Link></Button>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo</Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr,1fr,auto]">
          <div>
            <Label>Formato</Label>
            <Select value={ia.formato} onValueChange={(v) => setIa({ ...ia, formato: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="feed">Feed</SelectItem>
                <SelectItem value="carrossel">Carrossel</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="reels">Reels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tema para IA</Label>
            <Input placeholder="Ex.: automação de comandas em restaurantes" value={ia.tema} onChange={(e) => setIa({ ...ia, tema: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button onClick={() => gerarIA.mutate()} disabled={gerarIA.isPending} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />{gerarIA.isPending ? "Gerando…" : "Gerar com IA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (q.data?.length ?? 0) === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum conteúdo. Use a IA acima ou crie manualmente.</div> :
            <div className="divide-y">
              {q.data!.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="outline" className="text-[10px]">{c.formato}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                    <span className="font-medium">{c.titulo || "Sem título"}</span>
                  </div>
                  {c.legenda && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.legenda}</p>}
                  {c.hashtags && <p className="mt-1 text-xs text-primary">{c.hashtags}</p>}
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Novo conteúdo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Formato</Label>
                <Select value={form.formato} onValueChange={(v) => setForm({ ...form, formato: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed</SelectItem>
                    <SelectItem value="carrossel">Carrossel</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="reels">Reels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            </div>
            <div><Label>Legenda</Label><Textarea rows={4} value={form.legenda} onChange={(e) => setForm({ ...form, legenda: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hashtags</Label><Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} /></div>
              <div><Label>CTA</Label><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
