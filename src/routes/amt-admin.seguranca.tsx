import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { amtSeguranca } from "@/lib/amt-admin/admin.functions";

function SegurancaPage() {
  const fn = useServerFn(amtSeguranca);
  const { data } = useQuery({ queryKey: ["amt-seguranca"], queryFn: () => fn() });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Segurança</h1>
        <p className="text-sm text-muted-foreground">Acessos e tentativas de login.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Acessos ao painel</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left p-2">Quando</th><th className="text-left p-2">Rota</th>
              <th className="text-left p-2">IP</th><th className="text-left p-2">Usuário</th>
            </tr></thead>
            <tbody>
              {(data?.logs ?? []).map((l: any) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2 text-xs">{new Date(l.criado_em).toLocaleString("pt-BR")}</td>
                  <td className="p-2 font-mono text-xs">{l.rota}</td>
                  <td className="p-2 text-xs">{l.ip ?? "—"}</td>
                  <td className="p-2 text-xs">{l.user_id?.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tentativas de login</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr>
              <th className="text-left p-2">Quando</th><th className="text-left p-2">E-mail</th>
              <th className="text-left p-2">IP</th><th className="text-left p-2">Sucesso</th>
            </tr></thead>
            <tbody>
              {(data?.tentativas ?? []).map((t: any) => (
                <tr key={t.id} className="border-b">
                  <td className="p-2 text-xs">{new Date(t.criado_em).toLocaleString("pt-BR")}</td>
                  <td className="p-2 text-xs">{t.email}</td>
                  <td className="p-2 text-xs">{t.ip ?? "—"}</td>
                  <td className="p-2"><Badge variant={t.sucesso ? "default" : "destructive"}>{t.sucesso ? "OK" : "Falha"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/amt-admin/seguranca")({
  component: SegurancaPage,
});
