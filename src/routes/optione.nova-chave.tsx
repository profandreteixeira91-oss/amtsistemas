import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChaveDeAcesso } from "@/components/optione/access-key";
import { Eyebrow, OptioneShell } from "@/components/optione/shell";
import { optioneNovaChave } from "@/lib/optione.functions";

export const Route = createFileRoute("/optione/nova-chave")({
  head: () => ({
    meta: [
      { title: "Nova chave de acesso | AMT OptiOne" },
      {
        name: "description",
        content: "Gere uma nova chave de acesso para ativar computadores no AMT OptiOne.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "icon", href: "/optione/icone-amt-optione.png" }],
  }),
  component: NovaChavePage,
});

function NovaChavePage() {
  const gerar = useServerFn(optioneNovaChave);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<{ chave: string; codigo: string } | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErro("");
    setEnviando(true);
    try {
      const r = await gerar({ data: { email, password: senha } });
      if (!r.ok) setErro(r.error);
      else setResultado({ chave: r.access_key, codigo: r.store_code });
    } catch {
      setErro("Confira o e-mail e a senha e tente de novo.");
    } finally {
      setEnviando(false);
      setSenha("");
    }
  }

  return (
    <OptioneShell>
      <div className="mx-auto max-w-xl px-5 py-12 sm:px-6 sm:py-16">
        <Eyebrow>Chave de acesso</Eyebrow>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight">Gerar uma nova chave</h1>
        <p className="mt-3 text-muted-foreground">
          Para o dono da ótica que perdeu a chave. A chave anterior deixa de valer para ativar
          computadores novos; os computadores já ativados continuam funcionando normalmente.
        </p>

        {resultado ? (
          <div className="mt-8 space-y-4">
            <ChaveDeAcesso chave={resultado.chave} />
            <p className="text-center text-sm text-muted-foreground">
              Código da ótica: <strong className="text-foreground">{resultado.codigo}</strong>
            </p>
          </div>
        ) : (
          <Card className="mt-8 border-border bg-card shadow-sm">
            <CardContent className="p-5 sm:p-8">
              <form onSubmit={enviar} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail do dono</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="senha">Senha do AMT OptiOne</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                {erro && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {erro}
                  </p>
                )}
                <Button type="submit" size="lg" disabled={enviando} className="gap-2">
                  {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {enviando ? "Gerando…" : "Gerar nova chave"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Ainda não tem cadastro?{" "}
          <Link to="/optione/teste-gratis" className="font-medium text-primary hover:underline">
            Teste grátis por 14 dias
          </Link>
          .
        </p>
      </div>
    </OptioneShell>
  );
}
