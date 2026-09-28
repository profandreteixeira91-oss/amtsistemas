import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Star } from "lucide-react";
import { amtListarPlanos, amtSalvarPlano, amtListarSistemas } from "@/lib/amt-admin/admin.functions";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PlanosPage() {
  const qc = useQueryClient();
  const listar = useServerFn(amtListarPlanos);
  const listarSis = useServerFn(amtListarSistemas);
  const salvar = useServerFn(amtSalvarPlano);
  const [edit, setEdit] = useState<any | null>(null);

  const { data: planos } = useQuery({ queryKey: ["amt-planos"], queryFn: () => listar() });
  const { data: sistemas } = useQuery({ queryKey: ["amt-sistemas"], queryFn: () => listarSis() });

  const grupos = useMemo(() => {
    const map = new Map<string, { sistema: any; planos: any[] }>();
    for (const s of sistemas ?? []) map.set(s.id, { sistema: s, planos: [] });
    const geral: any[] = [];
    for (const p of planos ?? []) {
      if (p.sistema_id && map.has(p.sistema_id)) map.get(p.sistema_id)!.planos.push(p);
      else geral.push(p);
    }
    return { grupos: Array.from(map.values()), geral };
  }, [planos, sistemas]);

  const mut = useMutation({
    mutationFn: (payload: any) => salvar({ data: payload }),
    onSuccess: () => {
      toast.success("Plano salvo. Landings propagam em ≤30s.");
      qc.invalidateQueries({ queryKey: ["amt-planos"] });
      setEdit(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const novo = (sistema_id?: string) => setEdit({
    sistema_id: sistema_id ?? null, nome: "", slug: "", preco_mensal: 0, preco_anual: 0,
    ativo: true, recomendado: false, limites: {},
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planos & Preços</h1>
        <p className="text-sm text-muted-foreground">Editados aqui, publicados nas landings em ≤30s.</p>
      </div>

      {grupos.grupos.map(({ sistema, planos }) => (
        <section key={sistema.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {sistema.logo_url && <img src={sistema.logo_url} className="h-8 w-8 rounded object-contain bg-muted" alt="" />}
              <div>
                <h2 className="font-semibold">{sistema.nome}</h2>
                <div className="text-xs text-muted-foreground">/{sistema.slug} · {planos.length} planos</div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => novo(sistema.id)}><Plus className="h-4 w-4 mr-2" />Novo plano</Button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {planos.length === 0 && <div className="text-sm text-muted-foreground col-span-full border-2 border-dashed rounded p-4 text-center">Nenhum plano cadastrado.</div>}
            {planos.map((p) => <PlanoCard key={p.id} plano={p} onEdit={() => setEdit(p)} />)}
          </div>
        </section>
      ))}

      {grupos.geral.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Sem sistema vinculado</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {grupos.geral.map((p) => <PlanoCard key={p.id} plano={p} onEdit={() => setEdit(p)} />)}
          </div>
        </section>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="Nome"><Input value={edit.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></F>
                <F label="Slug"><Input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></F>
              </div>
              <F label="Sistema">
                <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={edit.sistema_id ?? ""} onChange={(e) => setEdit({ ...edit, sistema_id: e.target.value || null })}>
                  <option value="">— sem sistema —</option>
                  {(sistemas ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </F>
              <F label="Descrição"><Textarea rows={2} value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Preço mensal (R$)"><Input type="number" step="0.01" value={edit.preco_mensal ?? 0} onChange={(e) => setEdit({ ...edit, preco_mensal: Number(e.target.value) })} /></F>
                <F label="Preço anual (R$)"><Input type="number" step="0.01" value={edit.preco_anual ?? 0} onChange={(e) => setEdit({ ...edit, preco_anual: Number(e.target.value) })} /></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Badge (ex: Popular)"><Input value={edit.badge ?? ""} onChange={(e) => setEdit({ ...edit, badge: e.target.value })} /></F>
                <F label="Cor do card"><Input type="color" value={edit.cor ?? "#3b82f6"} onChange={(e) => setEdit({ ...edit, cor: e.target.value })} /></F>
              </div>
              <F label="Texto comercial"><Textarea rows={2} value={edit.texto_comercial ?? ""} onChange={(e) => setEdit({ ...edit, texto_comercial: e.target.value })} /></F>
              <F label="Texto do botão"><Input placeholder="Assinar agora" value={edit.botao_destaque ?? ""} onChange={(e) => setEdit({ ...edit, botao_destaque: e.target.value })} /></F>
              <F label="Recursos (um por linha)">
                <Textarea rows={5} value={(edit.recursos ?? []).join("\n")}
                  onChange={(e) => setEdit({ ...edit, recursos: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
              </F>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!edit.ativo} onCheckedChange={(v) => setEdit({ ...edit, ativo: v })} />Ativo</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!edit.recomendado} onCheckedChange={(v) => setEdit({ ...edit, recomendado: v })} />Recomendado</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={() => mut.mutate(edit)} disabled={mut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanoCard({ plano, onEdit }: { plano: any; onEdit: () => void }) {
  return (
    <Card className={plano.recomendado ? "ring-2 ring-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {plano.recomendado && <Star className="h-4 w-4 text-primary fill-primary" />}
            {plano.nome}
          </CardTitle>
          {plano.badge && <Badge>{plano.badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xl font-bold">{fmt(Number(plano.preco_mensal))}<span className="text-xs font-normal text-muted-foreground">/mês</span></div>
        <div className="text-xs text-muted-foreground">{fmt(Number(plano.preco_anual))}/ano</div>
        {plano.recursos?.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {plano.recursos.slice(0, 4).map((r: string, i: number) => <li key={i}>• {r}</li>)}
            {plano.recursos.length > 4 && <li>+{plano.recursos.length - 4} recursos</li>}
          </ul>
        )}
        <Button size="sm" variant="outline" onClick={onEdit} className="w-full"><Pencil className="h-4 w-4 mr-2" />Editar</Button>
      </CardContent>
    </Card>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

export const Route = createFileRoute("/amt-admin/planos")({
  component: PlanosPage,
});
