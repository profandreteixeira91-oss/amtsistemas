import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { portalListar, portalCriar, portalRevogar } from "@/lib/crm/portal.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Trash2, ExternalLink, Plus } from "lucide-react";

export const Route = createFileRoute("/crm/portal")({
  head: () => ({ meta: [{ title: "Portal do Cliente · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PortalPage,
});

function PortalPage() {
  const listar = useServerFn(portalListar);
  const criar = useServerFn(portalCriar);
  const revogar = useServerFn(portalRevogar);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", tipo: "proposta", ref: "", dias: 30 });

  const q = useQuery({ queryKey: ["portal_acessos"], queryFn: () => listar() });

  const mCriar = useMutation({
    mutationFn: async () => {
      const payload: any = { email: form.email, dias: form.dias };
      if (form.tipo === "proposta") payload.proposta_id = form.ref || null;
      if (form.tipo === "contrato") payload.contrato_id = form.ref || null;
      if (form.tipo === "lead") payload.lead_id = form.ref || null;
      return criar({ data: payload });
    },
    onSuccess: () => { toast.success("Acesso criado"); setOpen(false); setForm({ email: "", tipo: "proposta", ref: "", dias: 30 }); q.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const mRev = useMutation({
    mutationFn: (id: string) => revogar({ data: { id } }),
    onSuccess: () => { toast.success("Revogado"); q.refetch(); },
  });

  const linkOf = (token: string) => `${window.location.origin}/portal/${token}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portal do Cliente</h1>
          <p className="text-sm text-muted-foreground">Compartilhe propostas e contratos com clientes externos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo acesso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Gerar acesso ao portal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Email do cliente</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label>Vincular a</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>ID do {form.tipo}</Label><Input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="uuid" /></div>
              <div><Label>Validade (dias)</Label><Input type="number" value={form.dias} onChange={(e) => setForm({ ...form, dias: Number(e.target.value) })} /></div>
              <Button className="w-full" onClick={() => mCriar.mutate()} disabled={mCriar.isPending || !form.email}>Gerar link</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Acessos ativos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-6 text-sm text-muted-foreground">Carregando…</div> :
            (q.data?.length ?? 0) === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Nenhum acesso gerado.</div> :
            <div className="divide-y">
              {q.data!.map((a: any) => {
                const expirado = new Date(a.expires_at) < new Date();
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{a.email}</span>
                        <Badge variant={expirado ? "destructive" : "secondary"} className="text-[10px]">{expirado ? "expirado" : "ativo"}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.proposta_id ? `Proposta` : a.contrato_id ? `Contrato` : a.lead_id ? "Lead" : "—"} · expira {new Date(a.expires_at).toLocaleDateString("pt-BR")} · {a.access_count} acessos
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(linkOf(a.token)); toast.success("Link copiado"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(linkOf(a.token), "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => mRev.mutate(a.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
