import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { amtListarSistemas, amtSalvarSistema } from "@/lib/amt-admin/admin.functions";

function SistemasPage() {
  const qc = useQueryClient();
  const listar = useServerFn(amtListarSistemas);
  const salvar = useServerFn(amtSalvarSistema);
  const [edit, setEdit] = useState<any | null>(null);

  const { data: sistemas } = useQuery({ queryKey: ["amt-sistemas"], queryFn: () => listar() });

  const mut = useMutation({
    mutationFn: (payload: any) => salvar({ data: payload }),
    onSuccess: () => {
      toast.success("Sistema salvo. Landing propaga em ≤30s.");
      qc.invalidateQueries({ queryKey: ["amt-sistemas"] });
      setEdit(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sistemas</h1>
          <p className="text-sm text-muted-foreground">Alterações refletem nas landings (cache 30s).</p>
        </div>
        <Button onClick={() => setEdit({ trial_dias: 14, cores: {}, configuracoes: {} })}>
          <Plus className="h-4 w-4 mr-2" /> Novo sistema
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(sistemas ?? []).map((s: any) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {s.logo_url && <img src={s.logo_url} alt="" className="h-9 w-9 rounded object-contain bg-muted" />}
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{s.nome}</CardTitle>
                    <div className="text-xs text-muted-foreground">/{s.slug} · v{s.versao ?? "—"}</div>
                  </div>
                </div>
                <Badge variant={s.status === "ativo" ? "default" : "outline"}>{s.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {s.descricao && <p className="text-muted-foreground line-clamp-2">{s.descricao}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {s.dominio && <a className="hover:underline flex items-center gap-1" href={`https://${s.dominio}`} target="_blank" rel="noreferrer">{s.dominio} <ExternalLink className="h-3 w-3" /></a>}
                <span>· trial {s.trial_dias}d</span>
              </div>
              <div className="pt-2">
                <Button size="sm" variant="outline" onClick={() => setEdit(s)}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar sistema" : "Novo sistema"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome"><Input value={edit.nome ?? ""} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></Field>
                <Field label="Slug (URL)"><Input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
              </div>
              <Field label="Descrição"><Textarea rows={2} value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="URL do logo"><Input value={edit.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} /></Field>
                <Field label="Domínio"><Input value={edit.dominio ?? ""} onChange={(e) => setEdit({ ...edit, dominio: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Checkout URL"><Input value={edit.checkout_url ?? ""} onChange={(e) => setEdit({ ...edit, checkout_url: e.target.value })} /></Field>
                <Field label="Versão"><Input value={edit.versao ?? ""} onChange={(e) => setEdit({ ...edit, versao: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Trial (dias)"><Input type="number" value={edit.trial_dias ?? 14} onChange={(e) => setEdit({ ...edit, trial_dias: Number(e.target.value) })} /></Field>
                <Field label="Status">
                  <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={edit.status ?? "ativo"} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="beta">Beta</option>
                    <option value="lista_espera">Lista de espera</option>
                  </select>
                </Field>
                <Field label="Cor principal"><Input type="color" value={(edit.cores?.primary) ?? "#3b82f6"} onChange={(e) => setEdit({ ...edit, cores: { ...(edit.cores ?? {}), primary: e.target.value } })} /></Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}

export const Route = createFileRoute("/amt-admin/sistemas")({
  component: SistemasPage,
});
