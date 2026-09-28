import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Download, ImageIcon, AlertCircle } from "lucide-react";
import {
  iaGerarImagem,
  iaListarProvidersDisponiveis,
} from "@/lib/crm/ai-service.functions";

const LABEL: Record<string, string> = {
  lovable_ai: "Lovable AI (Gemini)",
  openai: "OpenAI (gpt-image / DALL·E)",
  gemini: "Google Gemini direto",
};

function Page() {
  const gerar = useServerFn(iaGerarImagem);
  const listar = useServerFn(iaListarProvidersDisponiveis);
  const [prompt, setPrompt] = useState("Logo minimalista para uma empresa de software fiscal chamada AMT Sistemas, moderno, azul e verde.");
  const [preferido, setPreferido] = useState<string>("auto");
  const [imagem, setImagem] = useState<string | null>(null);
  const [providerUsado, setProviderUsado] = useState<string | null>(null);
  const [tentativas, setTentativas] = useState<Array<{ provider: string; erro: string }>>([]);

  const { data: chains } = useQuery({
    queryKey: ["ia-chains"],
    queryFn: () => listar({}),
  });

  const mut = useMutation({
    mutationFn: async () => {
      const payload: any = { prompt };
      if (preferido !== "auto") payload.provider_preferido = preferido;
      return gerar({ data: payload });
    },
    onSuccess: (r: any) => {
      setImagem(r.image_url);
      setProviderUsado(r.provider_usado);
      setTentativas(r.tentativas ?? []);
      toast.success(`Imagem gerada por ${LABEL[r.provider_usado] ?? r.provider_usado}`);
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Falha ao gerar");
      setTentativas([]);
    },
  });

  const download = () => {
    if (!imagem) return;
    const a = document.createElement("a");
    a.href = imagem;
    a.download = `ia-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="h-6 w-6" /> Gerador de Imagens IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha o provedor ou deixe no automático — se o Lovable AI ficar sem créditos, cai para OpenAI/Gemini configurados em <a className="underline" href="/crm/integracoes">Integrações</a>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Prompt</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />

            <div className="flex gap-2 items-center">
              <span className="text-sm">Provedor:</span>
              <Select value={preferido} onValueChange={setPreferido}>
                <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático (cadeia de fallback)</SelectItem>
                  {(chains?.imagem ?? []).map((p: any) => (
                    <SelectItem key={p.tipo} value={p.tipo}>
                      {LABEL[p.tipo] ?? p.tipo} — {p.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="ml-auto">
                <Sparkles className="h-4 w-4 mr-1" />
                {mut.isPending ? "Gerando..." : "Gerar"}
              </Button>
            </div>

            {imagem && (
              <div className="space-y-2">
                <img src={imagem} alt="Gerada" className="rounded-lg border max-h-[512px]" />
                <div className="flex gap-2 items-center">
                  {providerUsado && <Badge>{LABEL[providerUsado] ?? providerUsado}</Badge>}
                  <Button variant="outline" size="sm" onClick={download}>
                    <Download className="h-4 w-4 mr-1" /> Baixar PNG
                  </Button>
                </div>
              </div>
            )}

            {tentativas.length > 0 && (
              <div className="text-xs bg-muted rounded p-2 space-y-1">
                <div className="font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Fallbacks acionados:
                </div>
                {tentativas.map((t, i) => (
                  <div key={i}>• <b>{t.provider}</b> falhou: {t.erro}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cadeia ativa</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="font-medium mb-1">Imagem</div>
              {(chains?.imagem ?? []).length === 0 && (
                <div className="text-muted-foreground text-xs">
                  Nenhum provedor configurado. Ative uma chave em /crm/integracoes.
                </div>
              )}
              {(chains?.imagem ?? []).map((p: any, i: number) => (
                <div key={p.tipo} className="flex items-center gap-2 py-1 border-b last:border-0">
                  <Badge variant="outline">{i + 1}º</Badge>
                  <span>{LABEL[p.tipo] ?? p.tipo}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{p.modelo}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="font-medium mb-1 mt-3">Texto</div>
              {(chains?.texto ?? []).map((p: any, i: number) => (
                <div key={p.tipo} className="flex items-center gap-2 py-1 border-b last:border-0">
                  <Badge variant="outline">{i + 1}º</Badge>
                  <span>{LABEL[p.tipo] ?? p.tipo}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{p.modelo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/crm/ia-imagens")({
  component: Page,
});
