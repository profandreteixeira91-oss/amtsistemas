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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Check, X, Minus } from "lucide-react";
import { amtListarModulos, amtSalvarModulo, amtSetPlanoModulo, amtListarPlanos } from "@/lib/amt-admin/admin.functions";

function ModulosPage() {
  const qc = useQueryClient();
  const listar = useServerFn(amtListarModulos);
  const salvar = useServerFn(amtSalvarModulo);
  const setPM = useServerFn(amtSetPlanoModulo);
  const listarPlanos = useServerFn(amtListarPlanos);

  const { data } = useQuery({ queryKey: ["amt-modulos"], queryFn: () => listar() });
  const { data: planos } = useQuery({ queryKey: ["amt-planos"], queryFn: () => listarPlanos() });
  const [edit, setEdit] = useState<any | null>(null);

  const matriz = useMemo(() => {
    const map = new Map<string, string>();
    for (const pm of data?.planoModulos ?? []) map.set(`${pm.plano_id}:${pm.modulo_id}`, pm.status);
    return map;
  }, [data]);

  const salvarM = useMutation({
    mutationFn: (p: any) => salvar({ data: p }),
    onSuccess: () => { toast.success("Módulo salvo"); qc.invalidateQueries({ queryKey: ["amt-modulos"] }); setEdit(null); },
  });

  const setStatus = useMutation({
    mutationFn: (p: any) => setPM({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amt-modulos"] }),
  });

  const cycle = (atual?: string) => atual === "liberado" ? "bloqueado" : atual === "bloqueado" ? "remover" : "liberado";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Módulos</h1>
          <p className="text-sm text-muted-foreground">Habilite ou bloqueie funcionalidades por plano.</p>
        </div>
        <Button onClick={() => setEdit({ chave: "", nome: "" })}><Plus className="h-4 w-4 mr-2" />Novo módulo</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Matriz módulos × planos</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Módulo</th>
                {(planos ?? []).map((p: any) => <th key={p.id} className="text-center p-2 text-xs font-medium">{p.nome}</th>)}
              </tr>
            </thead>
            <tbody>
              {(data?.modulos ?? []).map((m: any) => (
                <tr key={m.id} className="border-b hover:bg-muted/30">
                  <td className="p-2">
                    <div className="font-medium">{m.nome}</div>
                    <div className="text-xs text-muted-foreground">{m.chave}{m.categoria && ` · ${m.categoria}`}</div>
                    <button className="text-xs text-primary hover:underline" onClick={() => setEdit(m)}>editar</button>
                  </td>
                  {(planos ?? []).map((p: any) => {
                    const st = matriz.get(`${p.id}:${m.id}`);
                    return (
                      <td key={p.id} className="text-center p-2">
                        <button
                          className="inline-flex h-7 w-7 items-center justify-center rounded border hover:bg-muted"
                          onClick={() => setStatus.mutate({ plano_id: p.id, modulo_id: m.id, status: cycle(st) })}
                          title={st ?? "não definido"}
                        >
                          {st === "liberado" ? <Check className="h-4 w-4 text-green-600" /> :
                            st === "bloqueado" ? <X className="h-4 w-4 text-red-600" /> :
                            <Minus className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar módulo" : "Novo módulo"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <F label="Chave (sem espaços)"><Input value={edit.chave ?? ""} onChange={(e) => setEdit({ ...edit, chave: e.target.value })} /></F>
              <F label="Nome"><Input value={edit.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></F>
              <F label="Categoria"><Input value={edit.categoria ?? ""} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} /></F>
              <F label="Descrição"><Textarea rows={3} value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} /></F>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={() => salvarM.mutate(edit)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

export const Route = createFileRoute("/amt-admin/modulos")({
  component: ModulosPage,
});
