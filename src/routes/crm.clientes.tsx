import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";

export const Route = createFileRoute("/crm/clientes")({
  head: () => ({ meta: [{ title: "Clientes · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ClientesPage,
});

type Cliente = { id: string; razao_social: string | null; nome_fantasia: string | null; email: string | null; telefone: string | null; whatsapp: string | null; cidade: string | null; estado: string | null; status: string | null };

function ClientesPage() {
  const [q, setQ] = useState("");
  const listQ = useQuery({
    queryKey: ["crm_clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("manager_clientes").select("id, razao_social, nome_fantasia, email, telefone, whatsapp, cidade, estado, status").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const filtered = (listQ.data ?? []).filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [c.razao_social, c.nome_fantasia, c.email, c.cidade].some((v) => v?.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Base ativa de clientes AMT Sistemas.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {listQ.isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> :
            filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum cliente.</div> :
            <div className="divide-y">
              {filtered.map((c) => {
                const nome = c.nome_fantasia || c.razao_social || "Sem nome";
                return (
                  <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{nome}</span>
                        {c.nome_fantasia && c.razao_social && c.nome_fantasia !== c.razao_social && (
                          <span className="text-sm text-muted-foreground">· {c.razao_social}</span>
                        )}
                        {c.status && <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {[c.email, c.telefone || c.whatsapp, [c.cidade, c.estado].filter(Boolean).join("/")].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Mostrando {filtered.length} de {listQ.data?.length ?? 0} · Visão 360° detalhada na próxima entrega.</p>
    </div>
  );
}
