import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Search } from "lucide-react";
import { amtListarClientes, amtSalvarAssinatura } from "@/lib/amt-admin/admin.functions";

const fmt = (n: any) => Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ClientesPage() {
  const qc = useQueryClient();
  const listar = useServerFn(amtListarClientes);
  const salvar = useServerFn(amtSalvarAssinatura);
  const { data } = useQuery({ queryKey: ["amt-clientes"], queryFn: () => listar() });
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<any | null>(null);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data ?? [];
    return (data ?? []).filter((c: any) =>
      [c.nome, c.email, c.telefone, c.assinatura?.plano].some((v: any) => (v ?? "").toString().toLowerCase().includes(t))
    );
  }, [data, q]);

  const mut = useMutation({
    mutationFn: (p: any) => salvar({ data: p }),
    onSuccess: () => { toast.success("Assinatura salva. Sincronizando Asaas…"); qc.invalidateQueries({ queryKey: ["amt-clientes"] }); setEdit(null); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Clientes & Assinaturas</h1>
        <p className="text-sm text-muted-foreground">{filtrados.length} de {data?.length ?? 0}</p>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, e-mail, plano…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Plano</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Valor</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="p-2"><div className="font-medium">{c.nome}</div><div className="text-xs text-muted-foreground">{c.email}</div></td>
                  <td className="p-2">{c.assinatura?.plano ?? "—"}</td>
                  <td className="p-2"><Badge variant={c.assinatura?.status === "ativa" ? "default" : "outline"}>{c.assinatura?.status ?? "—"}</Badge></td>
                  <td className="p-2 text-right">{fmt(c.assinatura?.valor)}</td>
                  <td className="p-2 text-right">{c.assinatura && <Button size="sm" variant="outline" onClick={() => setEdit(c.assinatura)}><Pencil className="h-3 w-3" /></Button>}</td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum cliente.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar assinatura</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <F label="Plano"><Input value={edit.plano ?? ""} onChange={(e) => setEdit({ ...edit, plano: e.target.value })} /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Valor (R$)"><Input type="number" step="0.01" value={edit.valor ?? 0} onChange={(e) => setEdit({ ...edit, valor: Number(e.target.value) })} /></F>
                <F label="Desconto (R$)"><Input type="number" step="0.01" value={edit.desconto ?? 0} onChange={(e) => setEdit({ ...edit, desconto: Number(e.target.value) })} /></F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Ciclo">
                  <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={edit.ciclo ?? "mensal"} onChange={(e) => setEdit({ ...edit, ciclo: e.target.value })}>
                    <option value="mensal">Mensal</option><option value="anual">Anual</option>
                  </select>
                </F>
                <F label="Status">
                  <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={edit.status ?? "ativa"} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                    <option value="trial">Trial</option><option value="ativa">Ativa</option><option value="inadimplente">Inadimplente</option><option value="cancelada">Cancelada</option>
                  </select>
                </F>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={() => mut.mutate(edit)} disabled={mut.isPending}>Salvar e sincronizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

export const Route = createFileRoute("/amt-admin/clientes")({
  component: ClientesPage,
});
