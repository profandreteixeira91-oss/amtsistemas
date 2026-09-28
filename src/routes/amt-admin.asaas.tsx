import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCcw, Play } from "lucide-react";
import { amtAsaasFila, amtProcessarFilaAgora, amtReenfileirar } from "@/lib/amt-admin/admin.functions";

function AsaasPage() {
  const qc = useQueryClient();
  const listar = useServerFn(amtAsaasFila);
  const processar = useServerFn(amtProcessarFilaAgora);
  const reenf = useServerFn(amtReenfileirar);
  const { data } = useQuery({ queryKey: ["amt-asaas"], queryFn: () => listar(), refetchInterval: 15000 });

  const proc = useMutation({
    mutationFn: () => processar(),
    onSuccess: (r: any) => { toast.success(`Processado: ${r?.processados ?? 0}`); qc.invalidateQueries({ queryKey: ["amt-asaas"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const re = useMutation({
    mutationFn: (id: string) => reenf({ data: { id } }),
    onSuccess: () => { toast.success("Reenfileirado"); qc.invalidateQueries({ queryKey: ["amt-asaas"] }); },
  });

  const badgeVar = (s: string) => s === "sucesso" ? "default" : s === "erro" ? "destructive" : "outline";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asaas · Fila de sincronização</h1>
          <p className="text-sm text-muted-foreground">Alterações de assinaturas propagam via fila (cron a cada 5 min).</p>
        </div>
        <Button onClick={() => proc.mutate()} disabled={proc.isPending}><Play className="h-4 w-4 mr-2" />Processar agora</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Itens na fila</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left p-2">Tipo</th><th className="text-left p-2">Status</th>
              <th className="text-left p-2">Tentativas</th><th className="text-left p-2">Erro</th>
              <th className="text-left p-2">Criado</th><th className="p-2"></th>
            </tr></thead>
            <tbody>
              {(data?.fila ?? []).map((f: any) => (
                <tr key={f.id} className="border-b">
                  <td className="p-2 font-mono text-xs">{f.tipo}</td>
                  <td className="p-2"><Badge variant={badgeVar(f.status)}>{f.status}</Badge></td>
                  <td className="p-2">{f.tentativas ?? 0}</td>
                  <td className="p-2 text-xs text-red-600 max-w-xs truncate">{f.ultimo_erro}</td>
                  <td className="p-2 text-xs">{new Date(f.criado_em).toLocaleString("pt-BR")}</td>
                  <td className="p-2 text-right">{f.status === "erro" && <Button size="sm" variant="ghost" onClick={() => re.mutate(f.id)}><RefreshCcw className="h-3 w-3" /></Button>}</td>
                </tr>
              ))}
              {(data?.fila ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Fila vazia.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Logs recentes</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left p-2">Data</th><th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Status</th><th className="text-left p-2">Mensagem</th>
            </tr></thead>
            <tbody>
              {(data?.logs ?? []).map((l: any) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2 text-xs">{new Date(l.criado_em).toLocaleString("pt-BR")}</td>
                  <td className="p-2 font-mono text-xs">{l.tipo}</td>
                  <td className="p-2"><Badge variant={badgeVar(l.status)}>{l.status}</Badge></td>
                  <td className="p-2 text-xs max-w-md truncate">{l.mensagem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/amt-admin/asaas")({
  component: AsaasPage,
});
