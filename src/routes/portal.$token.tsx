import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { portalObterPorToken, portalAssinar } from "@/lib/crm/portal.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileSignature, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/$token")({
  head: () => ({ meta: [{ title: "Portal do Cliente" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PortalPublicPage,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md"><CardContent className="p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h1 className="text-lg font-semibold">Acesso inválido ou expirado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Solicite um novo link ao remetente.</p>
      </CardContent></Card>
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Não encontrado</div>,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PortalPublicPage() {
  const { token } = useParams({ from: "/portal/$token" });
  const obter = useServerFn(portalObterPorToken);
  const assinar = useServerFn(portalAssinar);
  const q = useQuery({ queryKey: ["portal", token], queryFn: () => obter({ data: { token } }) });

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [aceito, setAceito] = useState(false);
  const [ip, setIp] = useState<string>("");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json").then((r) => r.json()).then((d) => setIp(d.ip)).catch(() => {});
    if (q.data?.acesso?.email) setEmail(q.data.acesso.email);
  }, [q.data]);

  const alvo = q.data?.proposta ? { tipo: "proposta" as const, ref: q.data.proposta } : q.data?.contrato ? { tipo: "contrato" as const, ref: q.data.contrato } : null;
  const jaAssinado = (q.data?.assinaturas ?? []).find((a: any) => a.referencia_id === alvo?.ref.id);

  const mAssinar = useMutation({
    mutationFn: async () => {
      if (!alvo) throw new Error("Nada a assinar");
      const geo = await new Promise<any>((res) => {
        if (!navigator.geolocation) return res(null);
        navigator.geolocation.getCurrentPosition(
          (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
          () => res(null),
          { timeout: 3000 }
        );
      });
      return assinar({ data: {
        token, tipo: alvo.tipo, referencia_id: alvo.ref.id,
        signatario_nome: nome, signatario_email: email, signatario_documento: documento || undefined,
        ip, user_agent: navigator.userAgent, geo,
      }});
    },
    onSuccess: () => { toast.success("Documento assinado com sucesso"); q.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (q.error) throw q.error;

  const d = q.data!;
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-4 backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
          <div className="flex-1">
            <div className="text-sm font-medium">Portal do Cliente · AMT Sistemas</div>
            <div className="text-xs text-muted-foreground">Acesso seguro · Expira em {new Date(d.acesso.expires_at).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        {d.proposta && (
          <Card>
            <CardHeader><CardTitle className="text-base">Proposta Comercial #{d.proposta.numero}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Título</span><span className="font-medium">{d.proposta.titulo || "—"}</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted/40 p-3"><div className="text-xs text-muted-foreground">Setup</div><div className="text-lg font-bold">{brl(Number(d.proposta.valor_setup || 0))}</div></div>
                <div className="rounded-md bg-primary/10 p-3"><div className="text-xs text-muted-foreground">Mensalidade</div><div className="text-lg font-bold text-primary">{brl(Number(d.proposta.valor_mensal || 0))}</div></div>
              </div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><Badge>{d.proposta.status}</Badge></div>
              {d.proposta.observacoes && <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">{d.proposta.observacoes}</div>}
              {d.proposta.itens && Array.isArray(d.proposta.itens) && d.proposta.itens.length > 0 && (
                <div className="rounded-md border">
                  {d.proposta.itens.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between border-b p-2 text-sm last:border-b-0">
                      <span>{it.descricao || it.nome}</span><span className="tabular-nums">{brl(Number(it.valor || it.preco || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {d.contrato && (
          <Card>
            <CardHeader><CardTitle className="text-base">Contrato #{d.contrato.numero}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Título</span><span className="font-medium">{d.contrato.titulo || "—"}</span></div>
              {d.contrato.conteudo && <div className="max-h-96 overflow-auto rounded-md bg-muted/40 p-4 text-sm whitespace-pre-wrap">{d.contrato.conteudo}</div>}
            </CardContent>
          </Card>
        )}

        {alvo && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSignature className="h-4 w-4" /> Assinatura digital</CardTitle></CardHeader>
            <CardContent>
              {jaAssinado ? (
                <div className="rounded-md bg-emerald-500/10 p-4 text-sm">
                  <div className="mb-1 flex items-center gap-2 font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Documento assinado</div>
                  <div className="text-xs text-muted-foreground">Por {jaAssinado.signatario_nome} em {new Date(jaAssinado.assinado_em).toLocaleString("pt-BR")}</div>
                  <div className="mt-2 break-all font-mono text-[10px] text-muted-foreground">Hash: {jaAssinado.assinatura_hash}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>Nome completo</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
                    <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  </div>
                  <div><Label>CPF/CNPJ</Label><Input value={documento} onChange={(e) => setDocumento(e.target.value)} /></div>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={aceito} onCheckedChange={(v) => setAceito(Boolean(v))} />
                    <span>Li e concordo com os termos deste documento. Reconheço que esta assinatura digital tem validade legal (Lei 14.063/2020 e MP 2.200-2/2001), sendo registrados IP, geolocalização, dispositivo e horário como prova de autoria.</span>
                  </label>
                  <Button className="w-full" onClick={() => mAssinar.mutate()} disabled={!nome || !email || !aceito || mAssinar.isPending}>
                    {mAssinar.isPending ? "Assinando…" : "Assinar documento"}
                  </Button>
                  <div className="text-[10px] text-muted-foreground text-center">IP: {ip || "—"} · Navegador: {typeof window !== "undefined" ? navigator.userAgent.split(" ")[0] : "—"}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
