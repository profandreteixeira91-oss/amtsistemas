import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSignature, MapPin, Monitor, Hash } from "lucide-react";

export const Route = createFileRoute("/crm/assinaturas")({
  head: () => ({ meta: [{ title: "Assinaturas Digitais · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AssinaturasPage,
});

function AssinaturasPage() {
  const q = useQuery({
    queryKey: ["assinaturas_digitais"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_assinaturas_digitais").select("*").order("assinado_em", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assinaturas Digitais</h1>
        <p className="text-sm text-muted-foreground">Registro auditável de todas as assinaturas realizadas via portal.</p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Últimas assinaturas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-6 text-sm text-muted-foreground">Carregando…</div> :
            (q.data?.length ?? 0) === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma assinatura registrada ainda.</div> :
            <div className="divide-y">
              {q.data!.map((a: any) => (
                <div key={a.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileSignature className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.signatario_nome}</span>
                        <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                        <Badge className="text-[10px]">{a.metodo}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{a.signatario_email} · {a.signatario_documento || "sem documento"}</div>
                      <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                        <div className="flex items-center gap-1"><Monitor className="h-3 w-3" />IP {a.ip_address || "—"}</div>
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />
                          {a.geolocalizacao?.lat ? `${a.geolocalizacao.lat.toFixed(4)}, ${a.geolocalizacao.lng.toFixed(4)}` : "sem geo"}
                        </div>
                        <div className="flex items-center gap-1 sm:col-span-2"><Hash className="h-3 w-3" />
                          <span className="truncate font-mono">{a.assinatura_hash}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Assinado em {new Date(a.assinado_em).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
