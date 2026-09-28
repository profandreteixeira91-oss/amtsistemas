import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listarAlertas, marcarAlertaLido, gerarAlertas } from "@/lib/crm/alertas.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, RefreshCw, AlertTriangle, Info, Flame } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/alertas")({
  head: () => ({ meta: [{ title: "Alertas · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AlertasPage,
});

const sevIcon = { alta: Flame, media: AlertTriangle, info: Info } as const;
const sevColor = { alta: "text-red-500", media: "text-amber-500", info: "text-blue-500" } as const;

function AlertasPage() {
  const qc = useQueryClient();
  const listar = useServerFn(listarAlertas);
  const marcar = useServerFn(marcarAlertaLido);
  const gerar = useServerFn(gerarAlertas);

  const q = useQuery({
    queryKey: ["crm_alertas"],
    queryFn: () => listar({ data: { apenas_nao_lidos: false, limite: 100 } }),
    refetchInterval: 60_000,
  });

  const marcarM = useMutation({
    mutationFn: (payload: { id?: string; todos?: boolean }) => marcar({ data: payload as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm_alertas"] }),
  });

  const gerarM = useMutation({
    mutationFn: () => gerar(),
    onSuccess: (r: any) => { toast.success(`${r.criados} novos alertas`); qc.invalidateQueries({ queryKey: ["crm_alertas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const naoLidos = (q.data ?? []).filter((a: any) => !a.lido).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Bell className="h-5 w-5" /> Alertas
            {naoLidos > 0 && <Badge variant="destructive">{naoLidos} novos</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Central inteligente de prioridades comerciais.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => marcarM.mutate({ todos: true })} disabled={naoLidos === 0}>
            <CheckCheck className="mr-2 h-4 w-4" /> Marcar tudo como lido
          </Button>
          <Button size="sm" onClick={() => gerarM.mutate()} disabled={gerarM.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${gerarM.isPending ? "animate-spin" : ""}`} /> Rodar agora
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
           (q.data ?? []).length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum alerta ainda. Clique em <strong>Rodar agora</strong> para gerar.
            </div>
          ) : (
            <div className="divide-y">
              {(q.data as any[]).map((a) => {
                const Icon = sevIcon[a.severidade as keyof typeof sevIcon] ?? Info;
                const color = sevColor[a.severidade as keyof typeof sevColor] ?? "text-muted-foreground";
                return (
                  <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${a.lido ? "opacity-60" : ""}`}>
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.titulo}</span>
                        <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                        {!a.lido && <Badge variant="secondary" className="text-[10px]">novo</Badge>}
                      </div>
                      {a.mensagem && <p className="mt-0.5 text-sm text-muted-foreground">{a.mensagem}</p>}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString("pt-BR")}
                        {a.link && (<> · <Link to={a.link} className="text-primary hover:underline">Abrir</Link></>)}
                      </div>
                    </div>
                    {!a.lido && (
                      <Button size="sm" variant="ghost" onClick={() => marcarM.mutate({ id: a.id })}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Agendar geração automática (pg_cron):</p>
          <pre className="overflow-x-auto rounded bg-muted p-2 text-[10px]">{`select cron.schedule(
  'crm-alertas-tick',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://project--9004f8a7-a4e5-4c85-a320-7cc61b2f87a4.lovable.app/api/public/hooks/crm-alertas-tick',
    headers:='{"Content-Type":"application/json","apikey":"<SUA_PUBLISHABLE_KEY>"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
