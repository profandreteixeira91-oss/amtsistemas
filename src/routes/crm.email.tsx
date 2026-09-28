import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { iaGerarMensagem } from "@/lib/crm/ai-service.functions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/crm/email")({
  head: () => ({ meta: [{ title: "Email · CRM" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EmailPage,
});

function EmailPage() {
  const [empresa, setEmpresa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tom, setTom] = useState("consultivo");
  const [tipo, setTipo] = useState("prospeccao");
  const [saida, setSaida] = useState("");
  const [loading, setLoading] = useState(false);
  const gerar = useServerFn(iaGerarMensagem);

  async function run() {
    setLoading(true); setSaida("");
    try { const r = await gerar({ data: { canal: "email", empresa, categoria, tom, objetivo: tipo, cta: "responder este email" } }); setSaida(r.content); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email</h1>
        <p className="text-sm text-muted-foreground">Modelos e geração por IA: prospecção, follow-up, boas-vindas, proposta.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Novo email</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Empresa</Label><Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} /></div>
            <div><Label>Categoria</Label><Input value={categoria} onChange={(e) => setCategoria(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["prospeccao","follow-up","boas-vindas","proposta","recuperacao"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tom</Label>
                <Select value={tom} onValueChange={setTom}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["profissional","consultivo","formal","descontraido","educacional"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={run} disabled={loading || !empresa} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Gerando…" : "Gerar email"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Resultado</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={saida} onChange={(e) => setSaida(e.target.value)} className="min-h-72" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
