import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PlaceholderModule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Construction className="h-3 w-3" />
          Módulo em construção
        </Badge>
      </div>

      <Card className="border-dashed border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="text-base">Aguardando implementação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A estrutura desta seção faz parte do escopo do <strong>AMT Sistemas Manager</strong>.
            Ela será desenvolvida em iterações seguintes com dados reais, controle de acesso,
            paginação, filtros avançados, busca instantânea, auditoria e atualização em tempo real.
          </p>
          <p>
            Nenhuma informação fictícia é exibida — este módulo só passa a operar quando a fonte de
            dados correspondente estiver conectada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
