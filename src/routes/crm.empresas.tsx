import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export const Route = createFileRoute("/crm/empresas")({
  head: () => ({ meta: [{ title: "Empresas · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const [busca, setBusca] = useState("");
  const q = useQuery({
    queryKey: ["crm_empresas", busca],
    queryFn: async () => {
      let query = supabase.from("manager_clientes").select("id, razao_social, nome_fantasia, email, telefone, cidade, uf, status").order("created_at", { ascending: false }).limit(200);
      if (busca.trim()) query = query.or(`razao_social.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,email.ilike.%${busca}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">Cadastro de clientes/prospects.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar…" className="pl-7" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            (q.data?.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</div>
            ) : (
              <div className="divide-y">
                {q.data!.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{e.nome_fantasia || e.razao_social}</span>
                        {e.status && <Badge variant="secondary" className="text-[10px]">{e.status}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{[e.email, e.telefone, e.cidade && `${e.cidade}/${e.uf}`].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
