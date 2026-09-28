import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { amtAuditoria } from "@/lib/amt-admin/admin.functions";

function AuditoriaPage() {
  const fn = useServerFn(amtAuditoria);
  const { data } = useQuery({ queryKey: ["amt-auditoria"], queryFn: () => fn() });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Últimas 200 ações administrativas.</p>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left p-2">Quando</th><th className="text-left p-2">Ação</th>
              <th className="text-left p-2">Tabela</th><th className="text-left p-2">Registro</th>
              <th className="text-left p-2">Usuário</th>
            </tr></thead>
            <tbody>
              {(data ?? []).map((a: any) => (
                <tr key={a.id} className="border-b">
                  <td className="p-2 text-xs">{new Date(a.criado_em).toLocaleString("pt-BR")}</td>
                  <td className="p-2"><Badge variant="outline">{a.acao}</Badge></td>
                  <td className="p-2 font-mono text-xs">{a.tabela}</td>
                  <td className="p-2 font-mono text-xs">{a.registro_id}</td>
                  <td className="p-2 text-xs">{a.user_id?.slice(0, 8)}…</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem registros.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/amt-admin/auditoria")({
  component: AuditoriaPage,
});
