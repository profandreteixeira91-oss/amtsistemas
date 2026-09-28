import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModulePlaceholder({
  icon: Icon, title, subtitle, status = "Estrutura preparada",
  bullets = [],
  cta,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  status?: string;
  bullets?: string[];
  cta?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">{status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">O que já está pronto</CardTitle>
          <CardDescription>Tabelas, RLS e camada de IA prontas — sem mocks. Interface completa na próxima entrega.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {bullets.length === 0 ? (
            <p className="text-muted-foreground">Backend criado, aguardando UI final.</p>
          ) : bullets.map((b) => (
            <div key={b} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{b}</span>
            </div>
          ))}
          {cta && <div className="pt-2">{cta}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
