import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { iaGerarPost, iaGerarImagem, iaListarProvidersDisponiveis } from "@/lib/crm/ai-service.functions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Instagram, Sparkles, ImageIcon, Download } from "lucide-react";

export const Route = createFileRoute("/crm/instagram")({
  head: () => ({ meta: [{ title: "Instagram · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InstagramPage,
});

const LABEL_IMG: Record<string, string> = {
  pollinations: "Pollinations (grátis)",
  lovable_ai: "Lovable AI (Gemini)",
  openai: "OpenAI (gpt-image / DALL·E)",
  gemini: "Google Gemini",
  together_ai: "Together AI (FLUX)",
  stability: "Stability AI",
  huggingface: "Hugging Face",
};

function InstagramPage() {
  const [formato, setFormato] = useState<"feed"|"carrossel"|"story"|"reels">("feed");
  const [tema, setTema] = useState("");
  const [saida, setSaida] = useState("");
  const [loading, setLoading] = useState(false);
  const gerar = useServerFn(iaGerarPost);

  // ---- Imagem ----
  const gerarImg = useServerFn(iaGerarImagem);
  const listar = useServerFn(iaListarProvidersDisponiveis);
  const { data: chains } = useQuery({ queryKey: ["ia-chains-instagram"], queryFn: () => listar({}) });
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgProvider, setImgProvider] = useState<string>("");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgProviderUsado, setImgProviderUsado] = useState<string | null>(null);

  async function run() {
    setLoading(true); setSaida("");
    try { const r = await gerar({ data: { formato, tema } }); setSaida(r.content); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  async function runImg() {
    if (!imgProvider) { toast.error("Selecione uma IA para gerar a imagem"); return; }
    if (!imgPrompt.trim()) { toast.error("Escreva um prompt para a imagem"); return; }
    setImgLoading(true); setImgUrl(null); setImgProviderUsado(null);
    try {
      const r: any = await gerarImg({ data: { prompt: imgPrompt, provider_preferido: imgProvider as any, estrito: true } });
      setImgUrl(r.image_url);
      setImgProviderUsado(r.provider_usado);
      toast.success(`Imagem gerada por ${LABEL_IMG[r.provider_usado] ?? r.provider_usado}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImgLoading(false);
    }
  }

  function baixar() {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `instagram-${Date.now()}.png`;
    a.click();
  }

  const providersImg = chains?.imagem ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Instagram className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instagram IA</h1>
          <p className="text-sm text-muted-foreground">Gere post/carrossel/story/reels e artes visuais com a IA de sua preferência.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Novo conteúdo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Formato</Label>
              <Select value={formato} onValueChange={(v) => setFormato(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Post Feed</SelectItem>
                  <SelectItem value="carrossel">Carrossel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="reels">Reels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tema</Label><Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: Como reduzir CMV em restaurantes" /></div>
            <Button onClick={run} disabled={loading || !tema} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Gerando…" : "Gerar post"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Resultado (JSON)</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={saida} onChange={(e) => setSaida(e.target.value)} className="min-h-72 font-mono text-xs" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Geração de imagem
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Selecione qual IA irá gerar a arte. Apenas a IA escolhida será acionada — nenhuma cadeia de fallback.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div>
              <Label>Prompt da imagem</Label>
              <Textarea
                rows={4}
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="Ex: cartaz vertical minimalista para restaurante, tons quentes, com prato de massa artesanal"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Label className="mb-0">IA:</Label>
              <Select value={imgProvider} onValueChange={setImgProvider}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={providersImg.length ? "Selecione a IA" : "Nenhuma IA ativa"} />
                </SelectTrigger>
                <SelectContent>
                  {providersImg.map((p: any) => (
                    <SelectItem key={p.tipo} value={p.tipo}>
                      {LABEL_IMG[p.tipo] ?? p.tipo} — {p.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={runImg} disabled={imgLoading || !imgProvider || !imgPrompt.trim()} className="ml-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                {imgLoading ? "Gerando…" : "Gerar imagem"}
              </Button>
            </div>
            {providersImg.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum provedor de imagem ativo. Configure em <a className="underline" href="/crm/integracoes">/crm/integracoes</a>.
              </p>
            )}
          </div>
          <div className="space-y-2">
            {imgUrl ? (
              <>
                <img src={imgUrl} alt="Arte gerada" className="rounded-lg border w-full object-contain max-h-[420px] bg-muted" />
                <div className="flex items-center gap-2">
                  {imgProviderUsado && <Badge>{LABEL_IMG[imgProviderUsado] ?? imgProviderUsado}</Badge>}
                  <Button size="sm" variant="outline" onClick={baixar}>
                    <Download className="mr-1 h-4 w-4" /> Baixar
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-[280px] rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                A imagem aparecerá aqui
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
