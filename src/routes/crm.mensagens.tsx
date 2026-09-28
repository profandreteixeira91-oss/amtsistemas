import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Inbox, RefreshCw, Plus, AlertCircle } from "lucide-react";
import { enviarMensagemAgora, criarMensagemManual } from "@/lib/crm/mensagens.functions";

const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  pendente: "bg-amber-500/15 text-amber-600",
  enviada: "bg-emerald-500/15 text-emerald-600",
  recebida: "bg-blue-500/15 text-blue-600",
  falha: "bg-destructive/15 text-destructive",
};

function usePublishableKey() {
  return (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ?? "";
}

function CrmMensagensPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"saida" | "entrada" | "nova">("saida");
  const enviar = useServerFn(enviarMensagemAgora);
  const criar = useServerFn(criarMensagemManual);
  const key = usePublishableKey();

  const { data: mensagens, isLoading } = useQuery({
    queryKey: ["crm-mensagens", tab],
    queryFn: async () => {
      if (tab === "nova") return [];
      const { data, error } = await supabase
        .from("crm_mensagens")
        .select("id, canal, direcao, conteudo, status, erro, enviado_via, destinatario, assunto, created_at, enviado_em, lead_id")
        .eq("direcao", tab === "saida" ? "saida" : "entrada")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const enviarMut = useMutation({
    mutationFn: async (id: string) => enviar({ data: { mensagem_id: id } }),
    onSuccess: async () => {
      await dispararTick();
      qc.invalidateQueries({ queryKey: ["crm-mensagens"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao enviar"),
  });

  async function dispararTick() {
    try {
      const resp = await fetch("/api/public/hooks/crm-mensagens-tick", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: "{}",
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error ?? `${resp.status}`);
      toast.success(`Tick executado — ${json.processados ?? 0} processada(s)`);
    } catch (e: any) {
      toast.error(`Tick falhou: ${e.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Central de Mensagens</h1>
          <p className="text-sm text-muted-foreground">
            Todas as mensagens enviadas e recebidas do CRM. Configure provedores em Configurações → Canais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={dispararTick}>
            <RefreshCw className="mr-2 h-4 w-4" /> Disparar tick agora
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="saida"><Send className="mr-2 h-4 w-4" />Saída</TabsTrigger>
          <TabsTrigger value="entrada"><Inbox className="mr-2 h-4 w-4" />Inbox</TabsTrigger>
          <TabsTrigger value="nova"><Plus className="mr-2 h-4 w-4" />Nova</TabsTrigger>
        </TabsList>

        <TabsContent value="saida" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Mensagens enviadas / na fila</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
              {!isLoading && !mensagens?.length && <p className="text-sm text-muted-foreground">Nenhuma mensagem.</p>}
              {mensagens?.map((m: any) => (
                <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <Badge variant="outline" className="uppercase text-[10px]">{m.canal}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`rounded px-1.5 py-0.5 ${STATUS_COLOR[m.status] ?? ""}`}>{m.status}</span>
                      {m.destinatario && <span>→ {m.destinatario}</span>}
                      {m.enviado_via && <span>· via {m.enviado_via}</span>}
                      <span className="ml-auto">{new Date(m.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    {m.assunto && <p className="mt-1 text-sm font-medium">{m.assunto}</p>}
                    <p className="mt-1 whitespace-pre-wrap text-sm">{m.conteudo}</p>
                    {m.erro && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" /> {m.erro}
                      </p>
                    )}
                  </div>
                  {(m.status === "rascunho" || m.status === "falha") && (
                    <Button size="sm" variant="secondary" disabled={enviarMut.isPending} onClick={() => enviarMut.mutate(m.id)}>
                      <Send className="mr-1 h-3 w-3" /> Enviar
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrada" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inbox — mensagens recebidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="mb-3 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs">
                <p className="font-medium">Webhook receptor:</p>
                <code className="text-[11px] break-all">
                  POST {typeof window !== "undefined" ? window.location.origin : ""}/api/public/hooks/crm-inbox
                </code>
                <p className="mt-1 text-muted-foreground">
                  Header <code>apikey</code> com a chave publishable. Body: <code>{`{ canal, conteudo, remetente, nome?, empresa? }`}</code>
                </p>
              </div>
              {mensagens?.map((m: any) => (
                <div key={m.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="uppercase text-[10px]">{m.canal}</Badge>
                    {m.destinatario && <span>de {m.destinatario}</span>}
                    <span className="ml-auto">{new Date(m.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.conteudo}</p>
                </div>
              ))}
              {!mensagens?.length && !isLoading && <p className="text-sm text-muted-foreground">Nenhuma mensagem recebida ainda.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nova" className="mt-4">
          <NovaMensagemForm
            onCreate={async (payload) => {
              try {
                await criar({ data: payload });
                toast.success(payload.enviar_agora ? "Enfileirada para envio" : "Rascunho salvo");
                if (payload.enviar_agora) await dispararTick();
                setTab("saida");
                qc.invalidateQueries({ queryKey: ["crm-mensagens"] });
              } catch (e: any) {
                toast.error(e?.message ?? "Erro");
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NovaMensagemForm({ onCreate }: { onCreate: (p: any) => Promise<void> }) {
  const [canal, setCanal] = useState<"whatsapp" | "email" | "instagram" | "ligacao">("whatsapp");
  const [destinatario, setDest] = useState("");
  const [assunto, setAssunto] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Nova mensagem manual</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Canal</label>
            <Select value={canal} onValueChange={(v) => setCanal(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Destinatário (telefone/email/@handle)</label>
            <Input value={destinatario} onChange={(e) => setDest(e.target.value)} placeholder="5511999998888" />
          </div>
        </div>
        {canal === "email" && (
          <div>
            <label className="text-xs text-muted-foreground">Assunto</label>
            <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          </div>
        )}
        <div>
          <label className="text-xs text-muted-foreground">Conteúdo</label>
          <Textarea rows={6} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy || !conteudo}
            onClick={async () => { setBusy(true); await onCreate({ canal, destinatario, assunto, conteudo, enviar_agora: false }); setBusy(false); }}
          >Salvar rascunho</Button>
          <Button
            disabled={busy || !conteudo || !destinatario}
            onClick={async () => { setBusy(true); await onCreate({ canal, destinatario, assunto, conteudo, enviar_agora: true }); setBusy(false); }}
          ><Send className="mr-2 h-4 w-4" /> Enfileirar envio</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/crm/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens · AMT CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CrmMensagensPage,
});
