import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Radio, Copy } from "lucide-react";
import { salvarCanalConfig, removerCanalConfig } from "@/lib/crm/mensagens.functions";

const CANAIS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "ligacao", label: "Ligação" },
];
const PROVEDORES = [
  { value: "n8n_webhook", label: "n8n (webhook)" },
  { value: "make_webhook", label: "Make/Integromat (webhook)" },
  { value: "evolution_api", label: "Evolution API" },
  { value: "whatsapp_cloud", label: "WhatsApp Cloud API" },
  { value: "custom", label: "Webhook customizado" },
];

function CrmCanaisPage() {
  const qc = useQueryClient();
  const salvar = useServerFn(salvarCanalConfig);
  const remover = useServerFn(removerCanalConfig);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  const { data: canais } = useQuery({
    queryKey: ["crm-canais"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("crm_canais_config").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const salvarMut = useMutation({
    mutationFn: (p: any) => salvar({ data: p }),
    onSuccess: () => { toast.success("Salvo"); setOpen(false); setEdit(null); qc.invalidateQueries({ queryKey: ["crm-canais"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const removerMut = useMutation({
    mutationFn: (id: string) => remover({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["crm-canais"] }); },
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canais de envio</h1>
          <p className="text-sm text-muted-foreground">
            Configure webhooks (n8n, Make, Evolution) que recebem as mensagens do CRM e realizam o envio real.
          </p>
        </div>
        <Dialog open={open || !!edit} onOpenChange={(v) => { if (!v) { setOpen(false); setEdit(null); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEdit(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo canal</Button>
          </DialogTrigger>
          <CanalForm defaults={edit} onSubmit={(p) => salvarMut.mutate(p)} loading={salvarMut.isPending} />
        </Dialog>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Provedores configurados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!canais?.length && <p className="text-sm text-muted-foreground">Nenhum canal configurado. O envio ficará em fila até um provedor ser criado.</p>}
          {(canais ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <Radio className={`h-4 w-4 ${c.ativo ? "text-emerald-500" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="uppercase">{c.canal}</Badge>
                  <span className="font-medium">{PROVEDORES.find((p) => p.value === c.provedor)?.label ?? c.provedor}</span>
                  {!c.ativo && <Badge variant="secondary">inativo</Badge>}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{c.webhook_url ?? "sem URL"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEdit(c)}>Editar</Button>
              <Button variant="ghost" size="icon" onClick={() => removerMut.mutate(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Endpoints úteis</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <EndpointRow label="Envio (tick)" url={`${origin}/api/public/hooks/crm-mensagens-tick`} />
          <EndpointRow label="Inbox (receptor)" url={`${origin}/api/public/hooks/crm-inbox`} />
          <EndpointRow label="Sequências (tick)" url={`${origin}/api/public/hooks/crm-sequencias-tick`} />
          <p className="text-xs text-muted-foreground">
            Todos exigem header <code>apikey</code> com a chave publishable do projeto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function EndpointRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2">
      <Badge variant="outline" className="shrink-0">{label}</Badge>
      <code className="flex-1 truncate text-[11px]">{url}</code>
      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copiado"); }}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CanalForm({ defaults, onSubmit, loading }: { defaults: any; onSubmit: (p: any) => void; loading: boolean }) {
  const [canal, setCanal] = useState(defaults?.canal ?? "whatsapp");
  const [provedor, setProvedor] = useState(defaults?.provedor ?? "n8n_webhook");
  const [webhook, setWebhook] = useState(defaults?.webhook_url ?? "");
  const [ativo, setAtivo] = useState(defaults?.ativo ?? true);
  const [obs, setObs] = useState(defaults?.observacoes ?? "");
  const [headersText, setHeadersText] = useState(
    defaults?.headers_extras ? JSON.stringify(defaults.headers_extras, null, 2) : "{}"
  );

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{defaults ? "Editar canal" : "Novo canal"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Canal</label>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CANAIS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Provedor</label>
            <Select value={provedor} onValueChange={setProvedor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVEDORES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Webhook URL (recebe o POST do CRM)</label>
          <Input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://n8n.exemplo.com/webhook/xyz" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Headers extras (JSON)</label>
          <Textarea rows={4} value={headersText} onChange={(e) => setHeadersText(e.target.value)} className="font-mono text-xs" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Observações</label>
          <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={ativo} onCheckedChange={setAtivo} /> Ativo
        </label>
      </div>
      <DialogFooter>
        <Button
          disabled={loading}
          onClick={() => {
            let headers: any = {};
            try { headers = JSON.parse(headersText || "{}"); } catch { toast.error("Headers precisam ser JSON válido"); return; }
            onSubmit({
              id: defaults?.id,
              canal, provedor,
              webhook_url: webhook || null,
              headers_extras: headers,
              ativo,
              observacoes: obs || null,
            });
          }}
        >Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export const Route = createFileRoute("/crm/canais")({
  head: () => ({ meta: [{ title: "Canais · AMT CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CrmCanaisPage,
});
